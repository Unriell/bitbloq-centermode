'use strict';

var Group = require('./group.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    async = require('async'),
    mongoose = require('mongoose');

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
        Group.findById.bind(Group, groupId),
        function(group, next) {
            if (group.creator == userId) {
                next(null, group)
            } else {
                UserFunctions.userIsHeadMaster(userId, group.center, function(err) {
                    next(err, group);
                });
            }
        }
    ], function(err, group) {
        if (err) {
            console.log(err);
            res.status(err.code).send(err);
        } else {
            res.status(200).send(group);
        }
    });
};

/**
 * Get student group
 * @param req
 * @param res
 */
exports.getGroups = function(req, res) {
    var userId = req.user._id;
    Group.find({
        teacher: userId
    }, function(err, groups) {
        if (err) {
            console.log(err);
            res.status(err.code).send(err);
        } else {
            res.status(200).send(groups);
        }
    });
};

/**
 * Get student group by its teacher
 * @param req
 * @param res
 */
exports.getGroupByTeacher = function(req, res) {
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
                    next(401);
                } else {
                    group.update(req.body, next);
                }
            });
        }
    ], function(err) {
        if (err) {
            console.log(err);
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
                    next(401);
                } else {
                    group.remove(next);
                }
            });
        }
    ], function(err) {
        if (err) {
            console.log(err);
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
        }
    });
};
