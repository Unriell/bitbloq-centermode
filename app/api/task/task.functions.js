'use strict';
var Task = require('./task.model.js'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    async = require('async');


var maxPerPage = 10;

/**
 * Create task if user doesn't have this task
 * @param {Object} task
 * @param {String} studentId
 * @param {Function} next
 */
exports.checkAndCreateTask = function(taskData, studentId, next) {
    Task.findOne({
        exercise: taskData.exercise,
        student: studentId
    }, function(err, task) {
        if (task) {
            var taskObject = task.toObject();
            taskObject.initDate = taskData.initDate;
            taskObject.endDate = taskData.endDate;
            task.update(taskObject, function(err) {
                next(err, taskObject);
            });
        } else {
            taskData.student = studentId;
            var newTask = new Task(taskData);
            newTask.save(next);
        }
    });
};

/**
 * Get user average mark in specific group
 * @param {String} groupId
 * @param {Object} student
 * @param {Function} next
 */
exports.getAverageMark = function(groupId, student, next) {
    Task.find({
            group: groupId,
            student: student._id
        })
        .select('mark')
        .exec(function(err, tasks) {
            if (err) {
                next(err);
            } else {
                var studentObject = student.toObject();
                studentObject.averageMark = exports.calculateAverageMark(tasks);
                next(null, studentObject);
            }
        });
};

/**
 * Calculate user average mark
 * @param {String} tasks
 * @return {number} average
 */
exports.calculateAverageMark = function(tasks) {
    var sum = 0,
        counter = 0;
    tasks.forEach(function(task) {
        if (task.mark) {
            sum += task.mark;
            counter++;
        }
    });
    return (sum / counter);
};


/**
 * Get task groups
 * @param {String} exerciseId
 * @param {String} teacherId
 * @param {Function} next
 * @return {Array} groups
 */
exports.getGroups = function(exerciseId, teacherId, next) {
    Task.find({
            exercise: exerciseId,
            teacher: teacherId
        })
        .select('group initDate endDate')
        .populate('group', 'name center')
        .exec(function(err, tasks) {
            var groups = [];
            tasks.forEach(function(task) {
                var taskObject = task.toObject();
                _.extend(taskObject, taskObject.group);
                delete taskObject.group;
                groups.push(taskObject);
            });
            groups = _.uniqWith(groups, _.isEqual);
            next(err, groups);
        });
};


/**
 * Get exercises with specific center and teacher
 * @param {String} centerId
 * @param {String} teacherId
 * @param {Function} next
 * @return {Array} exercises
 */
exports.getExercises = function(centerId, teacherId, page, perPage, next) {
    page = page || 0;
    perPage = perPage || maxPerPage;
    Task.find({
            teacher: teacherId
        })
        .select('exercise group')
        .populate('exercise')
        .populate('group', 'center')
        .where('group.center').equals(mongoose.Schema.Types.ObjectId(centerId))
        .limit(parseInt(perPage))
        .skip(parseInt(perPage * page))
        .exec(function(err, tasks) {
            var exercises = [];
            tasks.forEach(function(task) {
                var taskObject = task.toObject();
                _.extend(taskObject, taskObject.exercise);
                delete taskObject.exercise;
                delete taskObject.group;
                exercises.push(taskObject);
            });
            next(err, exercises);
        });
};


/**
 * Get exercises with specific group
 * @param {String} groupId
 * @param {Function} next
 * @return {Array} tasks
 */
exports.getExercisesByGroup = function(groupId, next) {
    Task.find({
            group: groupId
        })
        .select('exercise group creator teacher initDate endDate')
        .exec(function(err, tasks) {
            var taskList = [];
            tasks.forEach(function(task) {
                var taskObject = task.toObject();
                delete taskObject._id;
                if (!_.some(taskList, taskObject)) {
                    taskList.push(taskObject);
                }
            });
            next(err, taskList);
        });
};


/**
 * Clone tasks
 * @param {String} groupId
 * @param {String} studentId
 * @param {Function} next
 * @return {Array} tasks
 */
exports.cloneTaskByGroup = function(groupId, studentId, next) {
    exports.getExercisesByGroup(groupId, function(err, tasks) {
        if (tasks) {
            async.map(tasks, function(task, next) {
                exports.checkAndCreateTask(task, studentId, next);
            }, next);
        } else {
            next(err);
        }
    });
};
