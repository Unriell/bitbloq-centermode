'use strict';

var Group = require('./group.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    TaskFunction = require('../task/task.functions.js'),
    AssignmentFunction = require('../assignment/assignment.functions.js'),
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
        function(next) {
            Group.findById(groupId)
                .populate('students', 'firstName lastName username email')
                .exec(next);
        },
        function(group, next) {
            if (group.creator === userId) {
                next(null, group);
            } else {
                if (String(group.teacher) === String(userId) || String(group.creator) === String(userId)) {
                    next(null, group);
                } else {
                    UserFunctions.userIsHeadmaster(userId, group.center, function(err, centerId) {
                        if (!centerId) {
                            next(401);
                        } else {
                            next(err, group);
                        }
                    });
                }
            }
        },
        function(group, next) {
            async.map(group.students, function(student, next) {
                TaskFunction.getAverageMark(group._id, student, next);
            }, function(err, students) {
                var groupObject = group.toObject();
                groupObject.students = students;
                next(err, groupObject);
            })
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
                        UserFunctions.userIsStudent(userId, next);
                }
            } else {
                UserFunctions.userIsStudent(userId, next);
            }
        },
        function(isStudent, next) {
            if (isStudent) {
                Group.find({
                    students: {
                        $in: [userId]
                    }
                }, next);
            } else {
                Group.find({
                    teacher: userId
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
 * Get student group in a center
 * @param req
 * @param res
 */
exports.getGroups = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId;
    async.waterfall([
        UserFunctions.userIsStudent.bind(UserFunctions, userId),
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
        UserFunctions.getCenterIdbyheadmaster.bind(UserFunctions, userId),
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
            group.userCanUpdate(userId, function(err, canUpdate) {
                if (err) {
                    next(err);
                } else if (!canUpdate) {
                    next({
                        code: 401,
                        message: 'Unauthorized'
                    });
                } else {
                    group.remove(next);
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
 * Delete a student if user is group teacher
 * @param req
 * @param res
 */
exports.deleteStudent = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.groupId,
        studentId = req.params.studentId;
    async.waterfall([
        Group.findOne.bind(Group, {
            _id: groupId,
            teacher: userId
        }),
        function(group, next) {
            if (group) {
                _.remove(group.students, function(item) {
                    return String(item) === studentId;
                });
                group.update(group, next);
            } else {
                next({
                    code: 404,
                    message: 'Not Found'
                });
            }
        },
        function(updated, next) {
            TaskFunction.delete(groupId, studentId, userId, next);
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
 * Register a student in a group
 * @param req
 * @param res
 */
exports.registerInGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.id;

    async.waterfall([
        Group.findOne.bind(Group, {
            accessId: groupId,
            status: 'open'
        }),
        function(group, next) {
            if (group) {
                group.students = group.students || [];
                if (group.students.indexOf(userId) === -1) {
                    group.students.push(userId);
                    group.update(group, function(err) {
                        if (err) {
                            next(err);
                        } else {
                            //Generate old tasks to student
                            AssignmentFunction.createTasksToStudent(group._id, userId, next);
                        }
                    });
                } else {
                    next();
                }
            } else {
                next({
                    code: 401,
                    message: 'Unauthorized'
                });
            }
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {

            res.sendStatus(200);
        }
    });
};

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