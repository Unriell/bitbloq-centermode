'use strict';

var Group = require('./group.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    AssignmentFunctions = require('../assignment/assignment.functions.js'),
    async = require('async'),
    _ = require('lodash'),
    triesCounter;

/**
 * Create group
 * @param req
 * @param res
 */
exports.createGroup = function(req, res) {
    var group = req.body;
    group.creator = req.user._id;
    var newGroup = new Group(group);
    triesCounter = 0;
    createGroup(newGroup, group, true, triesCounter, function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            if (err.code === 11000) {
                err.code = 409;
            }
            res.status(err.code).send(err);
        } else if (result) {
            res.status(200).send(result);
        } else {
            res.sendStatus(204);
        }
    });
};

/**
 * Get student group
 * @param req
 * @param res
 */
exports.getGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.id;
    async.waterfall([
        Group.findById.bind(Group, groupId),
        function(group, next) {
            if (group.creator === userId) {
                next(null, group);
            } else {
                if (String(group.teacher) === String(userId) || String(group.creator) === String(userId)) {
                    next(null, group);
                } else {
                    MemberFunctions.userIsHeadmaster(userId, group.center, function(err, centerId) {
                        if (!centerId) {
                            next({
                                code: 403,
                                message: 'Forbidden'
                            });
                        } else {
                            next(err, group);
                        }
                    });
                }
            }
        },
        function(group, next) {
            MemberFunctions.getStudentsByGroup(group._id, function(err, users) {
                next(err, group, users);
            });
        },
        function(group, users, next) {
            async.map(users, function(student, next) {
                TaskFunctions.getAverageMark(group._id, student, next);
            }, function(err, students) {
                var groupObject = group.toObject();
                groupObject.students = students;
                next(err, groupObject);
            });
        },
        function(group, next) {
            AssignmentFunctions.getExercisesByGroup(group._id, function(err, exercises) {
                if (exercises) {
                    group.exercises = exercises;
                }
                next(err, group);
            });
        }
    ], function(err, group) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(group);
        }
    });
};

/**
 * Get group as student or as teacher
 * @param req
 * @param res
 */
exports.getAllGroups = function(req, res) {
    var userId = req.user._id;
    async.waterfall([
        function(next) {
            if (req.query.role) {
                switch (req.query.role) {
                    case 'student':
                        next(null, true);
                        break;
                    case 'teacher':
                        next(null, false);
                        break;
                    default:
                        MemberFunctions.userIsStudent(userId, next);
                }
            } else {
                MemberFunctions.userIsStudent(userId, next);
            }
        },
        function(isStudent, next) {
            if (isStudent) {
                MemberFunctions.getGroups(userId, next);
            } else {
                var queryParams = {
                    teacher: userId
                };
                if(req.query.withoutClosed){
                    queryParams.status = {$ne: 'closed'};
                }
                async.waterfall([
                    Group.find.bind(Group, queryParams),
                    function(groups, next) {
                        async.map(groups, function(group, next) {
                            MemberFunctions.getStudentsByGroup(group._id, function(err, students) {
                                var groupObject = group.toObject();
                                groupObject.students = students;
                                next(err, groupObject);
                            });
                        }, next);
                    }
                ], next);
            }
        }
    ], function(err, groups) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(_.remove(groups, null));
        }
    });
};

/**
 * Get student group in a center
 * @param req
 * @param res
 */
exports.getGroups = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId;
    async.waterfall([
        MemberFunctions.userIsStudent.bind(MemberFunctions, userId),
        function(isStudent, next) {
            if (isStudent) {
                Group.find({
                    students: {
                        $in: [userId]
                    },
                    center: centerId
                }, next);
            } else {
                Group.find({
                    teacher: userId,
                    center: centerId
                }, next);
            }
        }
    ], function(err, groups) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(groups);
        }
    });
};

/**
 * Get student group by its teacher if user role is head master
 * @param req
 * @param res
 */
exports.getGroupByHeadmaster = function(req, res) {
    var userId = req.user._id,
        teacherId = req.params.teacherId;
    async.waterfall([
        MemberFunctions.getCenterIdByHeadmaster.bind(MemberFunctions, userId),
        function(centerId, next) {
            Group.find({
                teacher: teacherId,
                center: centerId
            }, next);
        }
    ], function(err, groups) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(groups);
        }
    });
};

/**
 * Update a student group
 * @param req
 * @param res
 */
exports.updateGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.id;
    async.waterfall([
        Group.findById.bind(Group, groupId),
        function(group, next) {
            group.userCanUpdate(userId, function(err, canUpdate) {
                if (err) {
                    next(err);
                } else if (!canUpdate) {
                    next({
                        code: 401,
                        message: 'Unauthorized'
                    });
                } else {
                    group.update(req.body, next);
                }
            });
        }
    ], function(err) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
        }
    });
};

/**
 * Delete a group if user is owner
 * @param req
 * @param res
 */
exports.deleteGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.id;
    async.waterfall([
        Group.findById.bind(Group, groupId),
        function(group, next) {
            if (group) {
                group.userCanUpdate(userId, function(err, canUpdate) {
                    next(err, group, canUpdate);
                });
            } else {
                next({
                    code: 404,
                    message: 'Exercise not found'
                });
            }
        },
        function(group, canUpdate, next) {
            if (canUpdate) {
                async.parallel([
                    group.delete.bind(group),
                    TaskFunctions.deleteByTeacherAndGroups.bind(TaskFunctions, userId, [groupId])
                ], next);
            } else {
                next({
                    code: 403,
                    message: 'Forbidden'
                });
            }
        }
    ], function(err) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
        }
    });
};


/*********************
 * Private functions *
 *********************/

function createGroup(group, groupData, recursive, triesCounter, next) {

    group.save(groupData, function(err, result) {
        if (err) {
            if (recursive && err.name === 'MongoError' && err.code === 11000) {
                if (triesCounter < 2) {
                    triesCounter = triesCounter + 1;
                    createGroup(group, groupData, true, triesCounter, next);
                } else {
                    createGroup(group, groupData, false, triesCounter, next);
                }
            } else {
                next(err, result);
            }
        } else {
            next(err, result);
        }
    });
}