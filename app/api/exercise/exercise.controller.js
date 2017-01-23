'use strict';

var Exercise = require('./exercise.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    ImageFunctions = require('../image/image.functions.js'),
    _ = require('lodash'),
    async = require('async');


var maxPerPage = 10;

/**
 * An exercise is assigned to group
 * @param {Object} group
 * @param {String} userId
 * @param {String} exerciseId
 * @param {Function} next
 */
function assignGroup(group, userId, exerciseId, next) {
    async.waterfall([
        function(next) {
            GroupFunctions.getStudents(group._id, userId, next);
        },
        function(students, next) {
            Exercise.findById(exerciseId, function(err, exercise) {
                next(err, exercise, students);
            });
        },
        function(exercise, students, next) {
            var task = {
                exercise: exercise._id,
                group: group._id,
                creator: userId,
                teacher: userId,
                initDate: group.calendar.from,
                endDate: group.calendar.to
            };
            async.map(students, function(student, next) {
                TaskFunctions.checkAndCreateTask(task, student, next);
            }, function(err, tasks) {
                next(err, tasks);
            });
        }
    ], next);
}

function clearExercise(exercise) {
    delete exercise._id;
    delete exercise.timesViewed;
    delete exercise.timesAdded;
    delete exercise._acl;
    delete exercise.__v;
    return exercise;
}


/**
 * An exercise is assigned to group
 * @param req
 * @param res
 */
exports.assignGroups = function(req, res) {
    var exerciseId = req.params.exerciseId,
        userId = req.user._id,
        groups = req.body;
    async.map(groups, function(group, next) {
        assignGroup(group, userId, exerciseId, next)
    }, function(err, newGroups) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(newGroups);
        }
    });
};

/**
 * Clone an exercise
 * @param req
 * @param res
 */
exports.clone = function(req, res) {
    var exerciseId = req.params.id,
        userId = req.user._id,
        newName = req.body.name;
    async.waterfall([
        Exercise.findById.bind(Exercise, exerciseId),
        function(exercise, next) {
            if (exercise.isOwner(userId)) {
                var exerciseObject = exercise.toObject();
                delete exerciseObject._id;
                exerciseObject.name = newName;
                exerciseObject.creator = userId;
                exerciseObject.teacher = userId;
                exerciseObject.groups = [];
                var newExercise = new Exercise(exerciseObject);
                newExercise.save(next);
            } else {
                next(401);
            }
        }
    ], function(err, newExercise) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(newExercise._id);
        }
    });
};

/**
 * Create an exercise
 * @param req
 * @param res
 */
exports.create = function(req, res) {
    var exerciseObject = clearExercise(req.body);
    exerciseObject.creator = req.user._id;
    exerciseObject.teacher = exerciseObject.teacher || req.user._id;
    var newExercise = new Exercise(exerciseObject);
    newExercise.save(function(err, exercise) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(exercise._id);
        }
    });
};

/**
 * Get info of exercise by id
 * @param req
 * @param res
 */
exports.get = function(req, res) {
    Exercise.findById(req.params.id)
        .populate('creator', 'username')
        .populate('teacher', 'username')
        .exec(function(err, exercise) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (!exercise) {
                res.sendStatus(404);
            } else {
                if (String(exercise.teacher._id) === String(req.user._id)) {
                    res.status(200).json(exercise);
                } else {
                    res.sendStatus(401);
                }
            }
        });
};

/**
 * Get my exercises
 * @param req
 * @param res
 */
exports.getAll = function(req, res) {
    var page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage

    Exercise.find({
            teacher: req.user._id
        })
        .limit(parseInt(perPage))
        .skip(parseInt(perPage * page))
        .exec(function(err, exercises) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(exercises);
            }
        });
};

/**
 * Get count of my exercises
 * @param req
 * @param res
 */

exports.getAllCount = function(req, res) {
    Exercise.count({
        teacher: req.user._id
    }, function(err, counter) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json({
                'count': counter
            });
        }
    });
};

/**
 * Get count of exercises of a determinate teacher
 * @param req
 * @param res
 */
exports.getCountByTeacher = function(req, res) {
    var userId = req.user._id,
        teacherId = req.params.teacherId;

    async.waterfall([
        UserFunctions.getCenterIdbyHeadMaster.bind(UserFunctions, userId),
        function(centerId, next) {
            UserFunctions.getTeacher(teacherId, centerId, next);
        },
        function(teacher, next) {
            Exercise.count({
                    teacher: teacherId
                })
                .exec(next)
        }
    ], function(err, counter) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json({
                'count': counter
            });
        }
    });

};

/**
 * Get exercises of a determinate teacher
 * @param req
 * @param res
 */
exports.getByTeacher = function(req, res) {

    var page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage,
        userId = req.user._id,
        teacherId = req.params.teacherId;
    async.waterfall([
        UserFunctions.getCenterIdbyHeadMaster.bind(UserFunctions, userId),
        function(centerId, next) {
            UserFunctions.getTeacher(teacherId, centerId, function(err, teacher) {
                next(err, teacher, centerId);
            });
        },
        function(teacher, centerId, next) {
            TaskFunctions.getExercises(centerId, teacher._id, page, perPage, next);
        }
    ], function(err, exercises) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(exercises);
        }
    });
};

/**
 * Update an exercise ir user is owner
 * @param req
 * @param res
 */
exports.update = function(req, res) {
    Exercise.findById(req.params.id, function(err, exercise) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            if (exercise.isOwner(req.user._id)) {
                var exerciseBody = clearExercise(req.body);
                exercise = _.extend(exercise, exerciseBody);
                exercise.save(function(err) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else {
                        res.sendStatus(200);
                    }
                });
            } else {
                res.sendStatus(401);
            }
        }
    });
};

/**
 * Check if user can update the exercise because user is owner
 * @param req
 * @param res
 */
exports.userIsOwner = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId;
    Exercise.findById(exerciseId, function(err, exercise) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            if (exercise) {
                if (exercise.isOwner(userId)) {
                    res.status(200).set({
                        'owner': true
                    }).send();
                } else {
                    res.status(204).set({
                        'owner': false
                    }).send();
                }
            } else {
                res.sendStatus(404);
            }
        }
    });

};


/**
 * Delete an exercise if user is owner
 * @param req
 * @param res
 */
exports.delete = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.id;
    async.waterfall([
        Exercise.findById.bind(Exercise, exerciseId),
        function(exercise, next) {
            if (exercise) {
                if (exercise.isOwner(userId)) {
                    Exercise.findByIdAndRemove(exerciseId, next);
                } else {
                    res.sendStatus(401);
                }
            } else {
                res.sendStatus(404);
            }
        },
        function(exercise, next) {
            ImageFunctions.delete('exercise', exerciseId, function() {
                next();
            });
        }

    ], function(err) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(204).end();
        }
    });
};
