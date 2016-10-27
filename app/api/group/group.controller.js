'use strict';

var Group = require('./group.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    async = require('async');

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

};

/**
 * Get student group by its teacher
 * @param req
 * @param res
 */
exports.getGroupByTeacher = function(req, res) {

};

/**
 * Update a student group
 * @param req
 * @param res
 */
exports.updateGroup = function(req, res) {

};

/**
 * Delete a group if user is owner
 * @param req
 * @param res
 */
exports.deleteGroup = function(req, res) {

};
