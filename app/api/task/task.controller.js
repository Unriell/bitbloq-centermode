'use strict';
var Task = require('./task.model.js');

/**
 * Get student task
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
 * Get student task
 * @param req
 * @param res
 */
exports.getTask = function(req, res) {

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
