'use strict';
var Task = require('./task.model.js'),
    _ = require('lodash');


function getResultTask(exercise) {
    var resultTask = {
        hardwareTags: exercise.hardwareTags,
        software: exercise.software,
        hardware: exercise.hardware,
        defaultTheme: exercise.defaultTheme
    };
    return resultTask;
}

/**
 * Get a student task
 * @param req
 * @param res
 */
exports.get = function(req, res) {
    Task.findById(req.params.id)
        .populate('exercise', 'name description teacher selectedBloqs hardwareTags software hardware defaultTheme')
        .exec(function(err, task) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (!task) {
                res.sendStatus(404);
            } else {
                if (String(task.creator) === String(req.user._id) || String(task.student) === String(req.user._id) || String(task.teacher) === String(req.user._id)) {
                    var taskId = task._id,
                        taskObject = task.toObject();
                    _.extend(taskObject, taskObject.exercise);
                    _.extend(taskObject, taskObject.result);
                    taskObject._id = taskId;
                    res.status(200).json(taskObject);
                } else {
                    res.sendStatus(401);
                }
            }
        });
};


/**
 * Get my tasks
 * @param req
 * @param res
 */
exports.getMyTasks = function(req, res) {
    var userId = req.user._id;
    Task.find({
            student: userId
        })
        .populate('exercise', 'name')
        .exec(function(err, tasks) {
                if (err) {
                    console.log(err);
                    err.code = parseInt(err.code) || 500;
                    res.status(err.code).send(err);
                } else {
                    res.status(200).send(tasks);
                }
            }
        );
};

/**
 * Get completed task by exercise
 * @param req
 * @param res
 */
exports.getTasksByExercise = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId;
    Task.find({
            exercise: exerciseId,
            $or: [{
                creator: userId
            },
                {
                    teacher: userId
                }]
        })
        .select('exercise, student group mark status initDate endDate')
        .populate('exercise', 'name createdAt')
        .populate('student', 'firstName lastName username')
        .populate('group', 'name')
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(tasks);
            }
        });
};


/**
 * Get tasks by group
 * @param req
 * @param res
 */
exports.getTasksByGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.groupId;
    Task.find({
            group: groupId,
            $or: [{
                creator: userId
            },
                {
                    teacher: userId
                }]
        })
        .populate('exercise', 'name')
        .exec(function(err, tasks) {
                if (err) {
                    console.log(err);
                    err.code = parseInt(err.code) || 500;
                    res.status(err.code).send(err);
                } else {
                    res.status(200).send(tasks);
                }
            }
        );
};

/**
 * Send task to teacher
 * @param req
 * @param res
 */
exports.sendTask = function(req, res) {
    var userId = req.user._id,
        taskId = req.params.taskId;
    Task.findOne({
        _id: taskId,
        student: userId
    }, function(err, task) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!task) {
            res.sendStatus(404);
        } else {
            //task exist
            var now = new Date();
            if (!task.initDate || now - task.initDate.getTime() > 0) {
                if (!task.endDate || now - task.endDate.getTime() <= 0) {
                    //can delivered
                    task.update({
                        status: 'delivered'
                    }, function(err, response) {
                        if (err) {
                            console.log(err);
                            err.code = parseInt(err.code) || 500;
                            res.status(err.code).send(err);
                        } else if (response && response.nModified === 0) {
                            res.sendStatus(404);
                        } else {
                            res.sendStatus(200);
                        }
                    });
                } else {
                    res.sendStatus(409);
                }
            } else {
                res.sendStatus(409);
            }
        }
    });
};

/**
 * Update a task if user is owner
 * @param req
 * @param res
 */
exports.update = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (task) {
            if (String(task.student) === String(req.user._id)) {
                task.result = getResultTask(req.body);
                task.save(function(err) {
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
        } else {
            res.sendStatus(404);
        }
    });
};

/**
 * Delete a task if user is owner
 * @param req
 * @param res
 */
exports.delete = function(req, res) {

};
