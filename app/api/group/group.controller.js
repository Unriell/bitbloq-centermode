'use strict';

var Group = require('./group.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    ExerciseFunction = require('../exercise/exercise.functions.js'),
    TaskFunction = require('../task/task.functions.js'),
    async = require('async'),
    _ = require('lodash');

/**
 * Create group
 * @param req
 * @param res
 */
exports.createGroup = function(req, res) {
    var userId = req.user._id,
        group = req.body;
    group.creator = userId;
    var newGroup = new Group(group);
    newGroup.save(group, function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (result) {
            res.sendStatus(200);
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
            if (group.creator == userId) {
                next(null, group)
            } else {
                if (String(group.teacher) === String(userId) || String(group.creator) === String(userId)) {
                    next(null, group);
                } else {
                    UserFunctions.userIsHeadMaster(userId, group.center, function(err) {
                        next(err, group);
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
        UserFunctions.userIsStudent.bind(UserFunctions, userId),
        function(isStudent, next) {
            if (isStudent) {
                Group.find({
                    students: {$in: [userId]}
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
                    students: {$in: [userId]},
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
 * Get groups by an exercise
 * @param req
 * @param res
 */
exports.getGroupsByExercise = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId;
    async.waterfall([
        ExerciseFunction.getInfo.bind(ExerciseFunction, exerciseId),
        function(exercise, next) {
            if (String(exercise.teacher) == userId) {
                next(null, {exercise: exercise});
            } else {
                //check if user is headMaster
                UserFunctions.getCenterIdbyHeadMaster(userId, function(err, centerId) {
                    if (!centerId) {
                        next({
                            code: 401,
                            message: 'Unauthorized'
                        });
                    } else {
                        next(err, {
                            exercise: exercise,
                            centerId: centerId
                        });
                    }
                });
            }
        },
        function(result, next) {
            TaskFunction.getGroups(result.exercise._id, result.exercise.teacher, function(err, groups) {
                next(err, groups, result.centerId);
            });
        },
        function(groups, centerId, next) {
            if (!centerId) {
                next(null, groups);
            } else {
                //get only groups of my center
                var myCenterGroups = _.filter(groups, function(group) {
                    return group.center == centerId;
                });
                next(null, myCenterGroups);
            }
        }
    ], function(err, myGroups) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(myGroups);
        }
    });
};

/**
 * Get student group by its teacher if user role is head master
 * @param req
 * @param res
 */
exports.getGroupByHeadMaster = function(req, res) {
    var userId = req.user._id,
        teacherId = req.params.teacherId;
    async.waterfall([
        UserFunctions.getCenterIdbyHeadMaster.bind(UserFunctions, userId),
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
 * Register a student in a group
 * @param req
 * @param res
 */
exports.registerInGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.id;

    Group.findOne({
        accessId: groupId,
        status: 'open'
    }, function(err, group) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (group) {
            group.students = group.students || [];
            if (group.students.indexOf(userId) === -1) {
                group.students.push(userId);
                group.update(group, function(err) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else {
                        res.sendStatus(200);
                    }
                });
            } else {
                res.sendStatus(200);
            }
        } else {
            res.sendStatus(401);
        }
    });


};
