'use strict';

var Exercise = require('./exercise.model.js');

function clearExercise(exercise) {
    delete exercise._id;
    delete exercise.timesViewed;
    delete exercise.timesAdded;
    delete exercise._acl;
    delete exercise.__v;
    return exercise;
}
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
 * Get a exercise by its task
 * @param req
 * @param res
 */
exports.getByTask = function(req, res) {

};

/**
 * Update an exercise ir user is owner
 * @param req
 * @param res
 */
exports.update = function(req, res) {

};


/**
 * Delete an exercise if user is owner
 * @param req
 * @param res
 */
exports.delete = function(req, res) {

};
