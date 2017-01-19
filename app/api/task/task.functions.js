'use strict';
var Task = require('./task.model.js'),
    _ = require('lodash');


/**
 * Create task
 * @param {Object} task
 * @param {String} studentId
 * @param {Function} next
 */
exports.createTask = function(task, studentId, next) {
    task.student = studentId;
    var newTask = new Task(task);
    newTask.save(next);
};

/**
 * Get user average mark in specific task
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
                var sum = 0,
                    counter = 0;
                tasks.forEach(function(task) {
                    if (task.mark) {
                        sum += task.mark;
                        counter++;
                    }
                });
                var studentObject = student.toObject();
                studentObject.averageMark = sum / counter;
                next(null, studentObject);
            }
        });
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
