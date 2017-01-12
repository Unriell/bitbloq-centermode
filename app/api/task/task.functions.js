'use strict';
var Task = require('./task.model.js');


/**
 * Create task
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 */
exports.createTask = function(task, studentId, next) {
    task.student = studentId;
    console.log(task);
    var newTask = new Task(task);
    newTask.save(next);
};
