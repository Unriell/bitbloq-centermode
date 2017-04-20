'use strict';

var Assignment = require('./assignment.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
    AssignmentFunctions = require('./assignment.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async');

/**
 * An exercise is assigned to group
 * @param {Object} req
 * @param {String} req.params.exerciseId
 * @param {Object} req.body.assign
 * @param {Object} req.body.remove
 * @param {String} req.body.remove.groupIds
 * @param {String} req.body.remove.exerciseId
 * @param res
 */
exports.assign = function(req, res) {
    var userId = req.user._id,
        groupsToAssign = req.body.assign,
        groupsToRemove = req.body.remove;

    async.parallel([
        function(next) {
            TaskFunctions.removeTasksByGroupAndEx(groupsToRemove.groupIds, groupsToRemove.exerciseId, next);
        },
        function(next) {
            Assignment.find({
                    exercise: groupsToRemove.exerciseId
                })
                .where('group').in(groupsToRemove.groupIds)
                .exec(function(err, assignments) {
                    async.map(assignments, function(assignment, callBack) {
                        assignment.delete(callBack);
                    }, function(err) {
                        next(err, assignments);
                    });
                });
        },
        function(next) {
            async.map(groupsToAssign, function(assignment, next) {
                createAssignment(assignment, userId, next);
            }, next);
        },
        function(next) {
            async.map(groupsToAssign, function(assignment, next) {
                AssignmentFunctions.createTasks(assignment, userId, next)
            }, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(result[3])
        }
    });
};

/**
 * Get assigned groups by an exercise
 * @param req
 * @param {String} req.params.exerciseId
 * @param res
 */
exports.getByExercise = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId;
    async.waterfall([
        MemberFunctions.getCenterIdByHeadmaster.bind(MemberFunctions, userId),
        function(centerId, next) {
            Assignment.find({
                    exercise: exerciseId
                })
                .populate('group')
                .or([{
                    'group.center': mongoose.Schema.Types.ObjectId(centerId)
                }, {
                    'group.teacher': mongoose.Schema.Types.ObjectId(userId)
                }])
                .exec(next);
        },
        function(assignments, next) {
            var groups = [];
            assignments.forEach(function(assignment) {
                var newGroup = assignment.toObject();
                groups.push(_.extend(newGroup, newGroup.group));
                delete newGroup.group;
            });
            next(null, groups);
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

exports.unassign = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId,
        groupId = req.params.groupId,
        assignment;
    async.waterfall([
            function(next) {
                Assignment.findOne({
                        'group': groupId,
                        'exercise': exerciseId,
                    })
                    .populate('group')
                    .exec(next)
            },
            function(found, next) {
                if (found) {
                    assignment = found;
                }
                MemberFunctions.userIsHeadmaster(userId, assignment.group.center, next);
            },
            function(isHeadmaster, next) {
                if (assignment && assignment.creator.equals(userId)) {
                    assignment.remove(next);
                } else {
                    if (isHeadmaster) {
                        assignment.remove(next);
                    } else {
                        next({
                            code: 403
                        })
                    }
                }
            }
        ],
        function(err, result) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                if (!result) {
                    res.sendStatus(404);
                } else {
                    res.sendStatus(200);
                }

            }

        });
}

/* **********************************
 ******** PRIVATE FUNCTIONS *********
 * **********************************/

/**
 * create an assignment
 * @param {Object} assignment
 * @param {String} userId
 * @param {Function} next
 */
function createAssignment(assignment, userId, next) {
    assignment.creator = userId;
    assignment.endDate = assignment.endDate || undefined;
    assignment.initDate = assignment.initDate || undefined;
    Assignment.update({
        group: assignment.group,
        exercise: assignment.exercise
    }, assignment, {
        upsert: true
    }, next);
}
