'use strict';
var Task = require('./task.model.js');


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
