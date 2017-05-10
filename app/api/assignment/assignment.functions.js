'use strict';
var Assignment = require('./assignment.model.js'),
    TaskFunctions = require('../task/task.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    MemberFunctions = require('../member/member.functions.js'),
    async = require('async');

/**
 * Get exercises by a group
 * @param {String} exerciseIds
 * @param {Function} next
 */
exports.getAssigmentByExercises = function(exerciseIds, next) {
    Assignment.find({})
        .where('exercise').in(exerciseIds)
        .select('exercise initDate endDate')
        .exec(function(err, assignments) {
            if (assignments) {
                var exercisesDates = [];
                assignments.forEach(function(assigment) {
                    if (exercisesDates[assigment.exercise] && exercisesDates[assigment.exercise].endDate) {
                        var dates = {};
                        if (!assigment.endDate) {
                            dates.initDate = exercisesDates[assigment.exercise].initDate;
                            dates.endDate = exercisesDates[assigment.exercise].endDate;
                        } else {
                            var today = new Date(),
                                assigmentDate = new Date(assigment.endDate);
                            if (assigmentDate.getTime() > today.getTime() && new Date(exercisesDates[assigment.exercise].endDate).getTime() > assigmentDate.getTime()) {
                                dates.initDate = assigment.initDate;
                                dates.endDate = assigment.endDate;
                            } else {
                                dates.initDate = exercisesDates[assigment.exercise].initDate;
                                dates.endDate = exercisesDates[assigment.exercise].endDate;
                            }
                        }
                        exercisesDates[assigment.exercise] = {
                            'initDate': dates.initDate,
                            'endDate': dates.endDate
                        }
                    } else {
                        exercisesDates[assigment.exercise] = {
                            'initDate': assigment.initDate,
                            'endDate': assigment.endDate
                        }
                    }
                });
                next(err, exercisesDates);
            } else {
                next(err);
            }
        });
};

/**
 * Get exercises by a group
 * @param {String} groupId
 * @param {Function} next
 */
exports.getExercisesByGroup = function(groupId, next) {
    Assignment.find({
            group: groupId
        })
        .populate('exercise')
        .select('exercise initDate endDate')
        .exec(function(err, assignments) {
                var exercises = [];
            assignments.forEach(function(assignment) {
                if (assignment.exercise) {
                    var exerciseObject = assignment.exercise.toObject();
                    exerciseObject.initDate = assignment.initDate;
                    exerciseObject.endDate = assignment.endDate;
                    exercises.push(exerciseObject);
                }
            });
            next(err, exercises);
        });
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
                async.map(students, function(student, next) {
                    TaskFunctions.checkAndCreateTask(task, student._id, null, next);
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


/**
 * assignment is removed by an exercise
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.removeByExercise = function(exerciseId, next) {
    async.waterfall([
        function(next) {
            Assignment.find({
                    'exercise': exerciseId
                })
                .populate('group')
                .exec(next)
        },
        function(assignments, next) {
            assignments.forEach(function(assignment) {
                assignment.delete();
            });
            next();
        }], next);
};
