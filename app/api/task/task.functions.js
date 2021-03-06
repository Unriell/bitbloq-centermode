'use strict';
var Task = require('./task.model.js'),
    GroupFunction = require('../group/group.functions.js'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    async = require('async');

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
        })
        .populate('group', 'name center')
        .populate({
            path: 'group',
            populate: {
                path: 'center',
                select: 'name activatedRobots -_id'
            }
        }).exec(function(err, task) {
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
                        'name': task.group.name,
                        'center': {
                            'activatedRobots': task.group.activatedRobots
                        }
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
                    GroupFunction.get(taskSaved.group, function(err, group) {
                        var groupTask = {
                            '_id': group._id,
                            'initDate': taskSaved.initDate,
                            'endDate': taskSaved.endDate,
                            'name': group.name,
                            'center': {
                                'activatedRobots': group.center.activatedRobots
                            }
                        };
                        next(err, groupTask);
                    });
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
    }).exec(function(err, tasks) {
        if (tasks.length > 0) {
            async.map(tasks, function(task, callback) {
                task.delete(callback);
            }, next);
        } else {
            next(err);
        }
    });
};

/**
 * Delete tasks by exercise
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.deleteByExercise = function(exerciseId, next) {
    Task.find({
        exercise: exerciseId
    }, function(err, tasks) {
        if (tasks.length > 0) {
            async.map(tasks, function(task, callback) {
                task.delete(callback);
            }, next);
        } else {
            next(err);
        }
    });
};

/**
 * Remove task with specific exercise and group
 * @param {Array} groupIdArray
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.deleteByGroupAndEx = function(groupIdArray, exerciseId, next) {
    Task.find({
            exercise: exerciseId
        })
        .where('group').in(groupIdArray)
        .exec(function(err, tasks) {
            if (err) {
                next(err);
            } else {
                async.map(tasks, function(task, callBack) {
                    task.delete(callBack);
                }, function(err) {
                    next(err, tasks);
                });
            }
        });
};

/**
 * Delete tasks by teacher an group array
 * @param {String} teacherId
 * @param {Array} groupIds
 * @param {Function} next
 */
exports.deleteByTeacherAndGroups = function(teacherId, groupIds, next) {
    Task.find({
            teacher: teacherId
        })
        .where('group').in(groupIds)
        .exec(function(err, tasks) {
            if (tasks && tasks.length > 0) {
                async.map(tasks, function(task, callback) {
                    task.delete(callback);
                }, next);
            } else {
                next(err);
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
