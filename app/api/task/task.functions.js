'use strict';
var Task = require('./task.model.js'),
    ExerciseFunction = require('../exercise/exercise.functions.js'),
    GroupFunction = require('../group/group.functions.js'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    Group = require('../group/group.model.js'),
    async = require('async');

var maxPerPage = 10;

/**
 * Create task if user doesn't have this task
 * @param {Object} taskData
 * @param {String} studentId
 * @param {String} groupName
 * @param {Function} next
 */
exports.checkAndCreateTask = function(taskData, studentId, groupName, next) {
    Task.findOne({
        exercise: taskData.exercise,
        group: taskData.group,
        student: studentId
    }).populate('group', 'name center').exec(function(err, task) {
        if (task) {
            //already a task
            var taskObject = task.toObject();
            taskObject.initDate = taskData.initDate;
            taskObject.endDate = taskData.endDate;
            task.update(taskObject, function(err) {
                if (!err) {
                    var groupTask = {
                        '_id': task.group._id,
                        'initDate': taskObject.initDate,
                        'endDate': taskObject.endDate,
                        'name': task.group.name
                    };
                    next(err, groupTask);
                } else {
                    next(err, {});
                }
            });
        } else {
            taskData.student = studentId;
            var newTask = new Task(taskData);
            newTask.save(function(err, taskSaved) {
                if (err) {
                    next(err);
                } else {
                    if (groupName) {
                        next(err, {
                            '_id': taskSaved.group,
                            'initDate': taskSaved.initDate,
                            'endDate': taskSaved.endDate,
                            'name': groupName
                        });
                    } else {
                        GroupFunction.get(taskSaved.group, function(err, group) {
                            var groupTask = {
                                '_id': group._id,
                                'initDate': taskSaved.initDate,
                                'endDate': taskSaved.endDate,
                                'name': group.name
                            };
                            next(err, groupTask);
                        });
                    }
                }
            });
        }
    });
};

/**
 * Delete tasks
 * @param {String} groupId
 * @param {String} studentId
 * @param {String} teacherId
 * @param {Function} next
 */
exports.delete = function(groupId, studentId, teacherId, next) {
    Task.find({
        group: groupId,
        student: studentId,
        teacher: teacherId
    }).remove(next);
};


/**
 * Delete tasks by exercise
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.deleteByExercise = function(exerciseId, next) {
    Task.find({
        exercise: exerciseId
    }).remove(next);
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
 * @param {Number} page
 * @param {Number} perPage
 * @param {Function} next
 * @return {Array} exercises
 */
exports.getExercises = function(centerId, teacherId, page, perPage, next) {
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
 * Get exercises count with specific center and teacher
 * @param {String} centerId
 * @param {String} teacherId
 * @param {Function} next
 * @return {Array} exercises
 */
exports.getExercisesCount = function(centerId, teacherId, next) {
    Task.count({
            teacher: teacherId
        })
        .where('group.center').equals(mongoose.Schema.Types.ObjectId(centerId))
        .exec(function(err, count) {
            next(err, count);
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
 * Remove task with specific exercise and group
 * @param {Array} groupIdArray
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.removeTasksByGroupAndEx = function(groupIdArray, exerciseId, next) {
    Task.find({
            exercise: exerciseId
        })
        .where('group').in(groupIdArray)
        .remove(next);
};

/**
 * Create default tasks
 * @param {Object} group
 * @param {String} studentId
 * @param {Function} next
 * @return {Array} tasks
 */
exports.createTaskByGroup = function(group, studentId, next) {
    ExerciseFunction.getExerciseByGroup(group._id, function(err, exercises) {
        if (exercises) {
            async.map(exercises, function(exercise, next) {
                var task = {
                    exercise: exercise._id,
                    group: group._id,
                    creator: group.creator,
                    teacher: group.teacher,
                    initDate: group.initDate,
                    endDate: group.endDate
                };
                exports.checkAndCreateTask(task, studentId, group.name, next);
            }, next);
        } else {
            next(err);
        }
    });
};
