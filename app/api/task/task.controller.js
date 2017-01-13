'use strict';
var Task = require('./task.model.js'),
    _ = require('lodash');

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
 * Get a student task
 * @param req
 * @param res
 */
exports.getTask = function(req, res) {
    Task.findById(req.params.id)
        .populate('exercise')
        .exec(function(err, task) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (!task) {
                res.sendStatus(404);
            } else {
                if (String(task.creator) === String(req.user._id) || String(task.student) === String(req.user._id) || String(task.teacher) === String(req.user._id)) {
                    _.extend(task, task.exercise);
                    res.status(200).json(task);
                } else {
                    res.sendStatus(401);
                }
            }
        });
};

/**
 * Get a specific task
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
 * Update a task if user is owner
 * @param req
 * @param res
 */
exports.updateTask = function(req, res) {

};

/**
 * Delete a task if user is owner
 * @param req
 * @param res
 */
exports.deleteTask = function(req, res) {

};
