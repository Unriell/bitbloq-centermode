'use strict';

var Exercise = require('./exercise.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    ImageFunctions = require('../image/image.functions.js'),
    _ = require('lodash'),
    async = require('async');

function clearExercise(exercise) {
    delete exercise._id;
    delete exercise.timesViewed;
    delete exercise.timesAdded;
    delete exercise._acl;
    delete exercise.__v;
    return exercise;
}

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
    Exercise.find({
        teacher: req.user._id
    }, function(err, exercises) {
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
 * Get exercises of a determinate teacher
 * @param req
 * @param res
 */
exports.getByTeacher = function(req, res) {
    var userId = req.user._id,
        teacherId = req.params.teacherId;
    async.waterfall([
        UserFunctions.getCenterIdbyHeadMaster.bind(UserFunctions, userId),
        function(centerId, next) {
            UserFunctions.getTeacher(teacherId, centerId, next);
        },
        function(teacher, next) {
            Exercise.find({
                teacher: teacherId
            }, next);
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
                exercise.save(function(err, exercise) {
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
