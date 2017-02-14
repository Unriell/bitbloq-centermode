'use strict';
var Task = require('./task.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    ProjectFunction = require('../project/project.functions.js'),
    TaskFunction = require('./task.functions.js'),
    GroupFunction = require('../group/group.functions.js'),
    async = require('async'),
    _ = require('lodash');

var maxPerPage = 10;

function getResultTask(exercise) {
    var resultTask = {
        hardwareTags: exercise.hardwareTags,
        software: exercise.software,
        hardware: exercise.hardware,
        defaultTheme: exercise.defaultTheme
    };
    return resultTask;
}

/**
 * Clone task as project
 * @param req
 * @param res
 */
exports.cloneToProject = function(req, res) {
    var taskId = req.body.taskId;
    async.waterfall([
        function(next) {
            Task.findById(taskId)
                .populate('exercise')
                .exec(next);
        },
        function(task, next) {
            if (task) {
                var project = task.toObject();
                _.extend(project, project.exercise);
                _.extend(project, project.result);
                delete project._id;
                next(null, project);
            } else {
                next({
                    code: 404,
                    message: 'Not found'
                });
            }
        },
        function(project, next) {
            project.creator = req.user._id;
            ProjectFunction.create(project, next);
        }
    ], function(err, project) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(project._id);
        }
    });
};

/**
 * Delete a student task
 * @param req
 * @param res
 */
exports.delete = function(req, res) {
    Task.find({
            _id: req.params.id,
            teacher: req.user._id
        })
        .remove()
        .exec(function(err, data) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (!data) {
                res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
};

/**
 * Get a student task
 * @param req
 * @param res
 */
exports.get = function(req, res) {
    Task.findById(req.params.id)
        .populate('exercise', 'name description teacher selectedBloqs hardwareTags software hardware defaultTheme')
        .exec(function(err, task) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (!task) {
                res.sendStatus(404);
            } else {
                if (String(task.creator) === String(req.user._id) || String(task.student) === String(req.user._id) || String(task.teacher) === String(req.user._id)) {
                    var taskId = task._id,
                        taskObject = task.toObject();
                    _.extend(taskObject, taskObject.exercise);
                    _.extend(taskObject, taskObject.result);
                    taskObject._id = taskId;
                    res.status(200).json(taskObject);
                } else {
                    res.sendStatus(401);
                }
            }
        });
};

/**
 * Get my tasks
 * @param req
 * @param res
 */
exports.getMyTasks = function(req, res) {
    var userId = req.user._id,
        now = Date.now();
    Task.find({
            student: userId

        })
        .or([{
            initDate: {
                $lt: now
            }
        }, {
            initDate: now
        }, {
            initDate: null
        }])
        .populate('exercise', 'name')
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(tasks);
            }
        });
};

/**
 * Get completed task by exercise
 * @param req
 * @param res
 */
exports.getTasksByExercise = function(req, res) {
    var page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage,
        userId = req.user._id,
        exerciseId = req.params.exerciseId;
    Task.find({
            exercise: exerciseId,
            $or: [{
                creator: userId
            }, {
                teacher: userId
            }]
        })
        .select('exercise student group mark status initDate endDate')
        .populate('exercise', 'name createdAt')
        .populate('student', 'firstName lastName username')
        .populate('group', 'name')
        .limit(parseInt(perPage))
        .skip(parseInt(perPage * page))
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(tasks);
            }
        });
};

/**
 * Get count of completed task by exercise
 * @param req
 * @param res
 */
exports.getTasksByExerciseCount = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId;
    Task.count({
        exercise: exerciseId,
        $or: [{
            creator: userId
        }, {
            teacher: userId
        }]
    }, function(err, counter) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json({
                'count': counter
            });
        }
    });
};

/**
 * Get completed task by student
 * @param req
 * @param res
 */
exports.getTasksByStudent = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.groupId,
        studentId = req.params.studentId;
    Task.find({
            student: studentId,
            group: groupId
        })
        .select('exercise student group mark status initDate endDate')
        .populate('exercise', 'name createdAt')
        .populate('student', 'firstName lastName username')
        .populate('group', 'name')
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                if (tasks.length > 0) {
                    console.log(tasks);
                    var taskList = [],
                        student = tasks[0].student.toObject();
                    student.average = TaskFunction.calculateAverageMark(tasks);
                    tasks.forEach(function(task) {
                        var taskObject = task.toObject(),
                            taskId = task._id;
                        _.extend(taskObject, taskObject.exercise);
                        taskObject._id = taskId;
                        taskList.push(taskObject);
                    });
                    res.status(200).json({
                        tasks: taskList,
                        group: tasks[0].group,
                        student: student
                    });
                } else {
                    async.parallel([
                        GroupFunction.get.bind(GroupFunction, groupId),
                        UserFunctions.getUserById.bind(UserFunctions, studentId)
                    ], function(err, result) {
                        if (err) {
                            console.log(err);
                            err.code = parseInt(err.code) || 500;
                            res.status(err.code).send(err);
                        } else {
                            res.status(200).json({
                                tasks: tasks,
                                group: result[0],
                                student: result[1]
                            });
                        }
                    });
                }
            }
        });
};

/**
 * Get tasks by group
 * @param req
 * @param res
 */
exports.getTasksByGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.groupId;
    Task.find({
            group: groupId,
            $or: [{
                creator: userId
            }, {
                teacher: userId
            }]
        })
        .populate('exercise', 'name')
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(tasks);
            }
        });
};

/**
 * Mark a task
 * @param req
 * @param res
 */
exports.mark = function(req, res) {
    var userId = req.user._id,
        taskId = req.params.taskId,
        markData = req.body;
    async.waterfall([
        function(next) {
            Task.findById(taskId)
                .populate('group', 'center')
                .exec(next);
        },
        function(task, next) {
            //  ==  it's correct because I want check only the content, I don't want check the type
            // If you change == to === this request will be rejected when user is teacher
            if (String(task.owner) == userId || String(task.teacher) == userId) {
                next(null, task);
            } else {
                UserFunctions.userIsHeadmaster(userId, task.group.center, function(err, centerId) {
                    if (!centerId) {
                        next({
                            code: 401,
                            message: 'Unauthorized'
                        });
                    } else {
                        next(err, task);
                    }
                });
            }
        },
        function(task, next) {
            task.update({
                mark: parseFloat(markData.mark),
                remark: markData.remark
            }, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(result);
        }
    });
};

/**
 * Send task to teacher
 * @param req
 * @param res
 */
exports.sendTask = function(req, res) {
    var userId = req.user._id,
        taskId = req.params.taskId;
    Task.findOne({
        _id: taskId,
        student: userId
    }, function(err, task) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!task) {
            res.sendStatus(404);
        } else {
            //task exist
            var now = new Date();
            if (!task.initDate || now - task.initDate.getTime() > 0) {
                if (!task.endDate || now - task.endDate.getTime() <= 0) {
                    //can deliver
                    task.update({
                        status: 'delivered'
                    }, function(err, response) {
                        if (err) {
                            console.log(err);
                            err.code = parseInt(err.code) || 500;
                            res.status(err.code).send(err);
                        } else if (response && response.nModified === 0) {
                            res.sendStatus(404);
                        } else {
                            res.sendStatus(200);
                        }
                    });
                } else {
                    res.sendStatus(409);
                }
            } else {
                res.sendStatus(409);
            }
        }
    });
};

/**
 * Update a task if user is owner
 * @param req
 * @param res
 */
exports.update = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (task) {
            if (String(task.student) === String(req.user._id)) {
                task.result = getResultTask(req.body);
                task.save(function(err) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else {
                        res.sendStatus(200);
                    }
                });
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(404);
        }
    });
};

/**
 * Check if user can update the exercise because user is the head master
 * @param req
 * @param res
 */
exports.userIsHeadmasterByTask = function(req, res) {
    var userId = req.user._id,
        taskId = req.params.taskId;
    Task.findById(taskId)
        .populate('group', 'center')
        .exec(function(err, task) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else {
                if (task && task.group && task.group.center) {
                    UserFunctions.userIsHeadmaster(userId, task.group.center, function(err, centerId) {
                        if (centerId) {
                            res.status(204).set({
                                'headmaster': true
                            }).send();
                        } else {
                            res.status(204).set({
                                'headmaster': false
                            }).send();
                        }
                    });
                } else {
                    res.sendStatus(404);
                }
            }
        });

};
