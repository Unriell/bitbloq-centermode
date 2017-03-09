'use strict';
var Assignment = require('./assignment.model.js'),
    TaskFunctions = require('../task/task.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    MemberFunctions = require('../member/member.functions.js'),
    async = require('async');


/**
 * Get exercise by its id
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.getInfo = function(exerciseId, next) {
    Exercise.findById(exerciseId, next);
};


/**
 * Get groups by exercise
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.getGroups = function(exerciseId, next) {
    Exercise.findById(exerciseId)
        .select('groups teacher')
        .populate('groups')
        .exec(next);
};


/**
 * Get exercises by group id
 * @param {String} groupId
 * @param {Function} next
 */
exports.getAssignmentsByGroup = function(groupId, next) {
    Assignment.find({
            group: groupId
        })
        .populate('students')
        .populate('group', 'teacher')
        .exec(next);
};

/**
 * create assigned tasks by a groupId
 * @param {String} groupId
 * @param {String} studentId
 * @param {Function} next
 */
exports.createTasksToStudent = function(groupId, studentId, next) {
    async.waterfall([
        function(callback) {
            Assignment.find({
                    group: groupId
                })
                .populate('students')
                .populate('group', 'teacher')
                .exec(callback);
        },
        function(assignments, callback) {
            async.map(assignments, function(assignment) {
                var task = {
                    exercise: assignment.exercise,
                    group: assignment.group,
                    creator: assignment.creator,
                    teacher: assignment.group.teacher || assignment.creator,
                    initDate: assignment.initDate,
                    endDate: assignment.endDate
                };
                TaskFunctions.checkAndCreateTask(task, studentId, null, callback);
            }, callback);
        }
    ], function(err, newTask) {
        next(err, newTask[0]);
    });
};

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
exports.createTasks = function(assignment, userId, next) {
    async.waterfall([
        MemberFunctions.getStudentsByGroup.bind(MemberFunctions, assignment.group),
        function(students, next) {
            var task = {
                exercise: assignment.exercise,
                group: assignment.group,
                creator: userId || assignment.creator,
                teacher: userId || assignment.group.teacher || assignment.creator,
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
};