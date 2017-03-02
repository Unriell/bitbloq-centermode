'use strict';

var Assignment = require('./assignment.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
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
            Assignment.find({exercise: groupsToRemove.exerciseId})
                .where('group').in(groupsToRemove.groupIds)
                .remove(next);
        },
        function(next) {
            async.map(groupsToAssign, function(assignment, next) {
                createAssignment(assignment, userId, next);
            }, next);
        },
        function(next) {
            async.map(groupsToAssign, function(assignment, next) {
                createTasks(assignment, userId, next)
            }, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(result[2])
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
        UserFunctions.getCenterIdbyheadmaster.bind(UserFunctions, userId),
        function(centerId, next) {
            Assignment.find({
                    exercise: exerciseId
                })
                .populate('group')
                .or([{'group.center': mongoose.Schema.Types.ObjectId(centerId)}, {'group.teacher': mongoose.Schema.Types.ObjectId(userId)}])
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


/* **********************************
 ******** PRIVATE FUNCTIONS *********
 * **********************************/

/**
 * create tasks by an assignment
 * @param {Object} assignment
 * @param {String} assignment.group
 * @param {String} assignment.exercise
 * @param {Date} assignment.initDate [optional]
 * @param {Date} assignment.endDate [optional]
 * @param {String} userId
 * @param {Function} next
 */
function createTasks(assignment, userId, next) {
    async.waterfall([
        function(next) {
            GroupFunctions.getStudents(assignment.group, userId, next);
        },
        function(students, next) {
            var task = {
                exercise: assignment.exercise,
                group: assignment.group,
                creator: userId,
                teacher: userId,
                initDate: assignment.initDate,
                endDate: assignment.endDate
            };
            if (students.length > 0) {
                async.map(students, function(studentId, next) {
                    TaskFunctions.checkAndCreateTask(task, studentId, null, next);
                }, next);
            } else {
                GroupFunctions.get(assignment.group, function(err, result) {
                    next(err, [{
                        _id: assignment.group,
                        name: result.name,
                        initDate: assignment.initDate,
                        endDate: assignment.endDate
                    }]);
                });
            }
        }
    ], function(err, newTask) {
        next(err, newTask[0]);
    });
}

/**
 * create an assignment
 * @param {Object} assignment
 * @param {String} userId
 * @param {Function} next
 */
function createAssignment(assignment, userId, next) {
    assignment.creator = userId;
    Assignment.update({
        group: assignment.group,
        exercise: assignment.exercise
    }, assignment, {upsert: true}, next);
}

