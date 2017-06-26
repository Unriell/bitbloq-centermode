'use strict';

var Exercise = require('./exercise.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    MemberFunctions = require('../member/member.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    AssignmentFunctions = require('../assignment/assignment.functions.js'),
    _ = require('lodash'),
    async = require('async');

var maxPerPage = 10;

function clearExercise(exercise) {
    delete exercise._id;
    delete exercise.timesViewed;
    delete exercise.timesAdded;
    delete exercise._acl;
    delete exercise.__v;
    return exercise;
}

/**
 * Clone an exercise
 * @param req
 * @param res
 */
exports.clone = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.body.exerciseId,
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
                var newExercise = new Exercise(exerciseObject);
                newExercise.save(next);
            } else {
                next(401);
            }
        }
    ], function(err, newExercise) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage,
        search = req.query,
        queryParams = {};

    if (search.searchParams && (JSON.parse(search.searchParams)).name) {
        queryParams = {
            name: {
                $regex: (JSON.parse(search.searchParams)).name,
                $options: 'i'
            },
            teacher: req.user._id
        };
    } else {
        queryParams = {
            teacher: req.user._id
        }
    }

    async.waterfall([
        function(next) {
            Exercise.find(queryParams)
                .limit(parseInt(perPage))
                .skip(parseInt(perPage * page))
                .exec(next);
        },
        function(exercises, next) {
            var newExercises = [];
            if (exercises.length > 0) {
                var exercisesId = _.map(exercises, '_id');
                AssignmentFunctions.getAssigmentByExercises(exercisesId, function(err, exercisesDates) {
                    if (exercisesDates) {
                        exercises.forEach(function(exercise) {
                            var exerciseObject = exercise.toObject();
                            if (exercisesDates[exercise._id]) {
                                exerciseObject.initDate = exercisesDates[exercise._id].initDate;
                                exerciseObject.endDate = exercisesDates[exercise._id].endDate;
                            }
                            newExercises.push(exerciseObject);
                        });
                        next(err, newExercises);
                    } else {
                        next(err, exercises);
                    }
                });
            } else {
                next(null, exercises);
            }
        }

    ], function(err, exercises) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
    var search = req.query,
        queryParams = {};

    if (search.name) {
        queryParams = {
            name: {
                $regex: search.name,
                $options: 'i'
            },
            teacher: req.user._id
        };
    } else {
        queryParams = {
            teacher: req.user._id
        };
    }
    Exercise.count(queryParams, function(err, counter) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
        MemberFunctions.getCenterIdByHeadmaster.bind(UserFunctions, userId),
        function(centerId, next) {
            if (!centerId) {
                next({
                    code: 401,
                    message: 'Unauthorized'
                });
            } else {
                MemberFunctions.getTeacher(teacherId, centerId, function(err, teacher) {
                    if (!teacher) {
                        next({
                            code: 404,
                            message: 'Teacher not found'
                        });
                    } else {
                        next(err, teacher, centerId);
                    }
                });
            }
        },
        function(teacher, centerId, next) {
            TaskFunctions.getExercisesCount(centerId, teacher._id, next);
        }
    ], function(err, counter) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
    var userId = req.user._id,
        teacherId = req.params.teacherId;
    //page = req.query.page - 1 || 0,
    //perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage,

    async.waterfall([
        MemberFunctions.getCenterIdByHeadmaster.bind(UserFunctions, userId),
        function(centerId, next) {
            if (!centerId) {
                next({
                    code: 401,
                    message: 'Unauthorized'
                });
            } else {
                MemberFunctions.getTeacher(teacherId, centerId, function(err, teacher) {
                    if (!teacher) {
                        next({
                            code: 404,
                            message: 'Teacher not found'
                        });
                    } else {
                        next(err, teacher, centerId);
                    }
                });
            }
        },
        function(teacher, centerId, next) {
            AssignmentFunctions.getExercisesByCenterTeacher(centerId, teacher._id, next);
        }
    ], function(err, exercises) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            if (exercise.isOwner(req.user._id)) {
                var exerciseBody = clearExercise(req.body);
                exercise = _.extend(exercise, exerciseBody);
                exercise.save(function(err) {
                    if (err) {
                        console.log(err);
                        err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
                    async.parallel([
                        exercise.delete.bind(exercise),
                        TaskFunctions.deleteByExercise.bind(TaskFunctions, exerciseId)
                    ], next);
                } else {
                    next({
                        code: 401,
                        message: 'Unauthorized'
                    });
                }
            } else {
                next({
                    code: 404,
                    message: 'Exercise not found'
                });
            }
        }
    ], function(err) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(204).end();
        }
    });
};
