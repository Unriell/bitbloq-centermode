'use strict';
var Task = require('./task.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    MemberFunctions = require('../member/member.functions.js'),
    ProjectFunction = require('../project/project.functions.js'),
    TaskFunction = require('./task.functions.js'),
    GroupFunction = require('../group/group.functions.js'),
    AssignmentFunction = require('../assignment/assignment.functions.js'),
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
    async.waterfall([
        Task.findOne.bind(Task, {
            _id: req.params.id,
            teacher: req.user._id
        }),
        function(task, next) {
            if (task) {
                task.delete(next);
            } else {
                next();
            }
        }
    ], function(err, data) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
        .populate('exercise', 'name description teacher selectedBloqs hardwareTags software hardware defaultTheme useBitbloqConnect bitbloqConnectBT')
        .populate({
            path: 'group',
            populate: {
                path: 'center',
                select: 'name activatedRobots -_id'
            }
        })
        .populate('student', 'firstName lastName username')
        .exec(function(err, task) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else if (!task) {
                res.sendStatus(404);
            } else {
                if (String(task.creator) === String(req.user._id) || String(task.student._id) === String(req.user._id) || String(task.teacher) === String(req.user._id)) {
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
exports.getMyTasksInGroup = function(req, res) {
    var userId = req.user._id,
        groupId = req.params.groupId,
        page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage;

    async.parallel([
        function(next) {
            Task.find({
                    student: userId,
                    group: groupId
                })
                .populate('exercise', 'name')
                .lean()
                .limit(parseInt(perPage))
                .skip(parseInt(perPage * page))
                .exec(next);
        },
        function(next) {
            Task.count({
                student: userId,
                group: groupId
            }, next);
        }
    ], function(err, response) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            AssignmentFunction.getDateByGroupAndExercises(groupId, _.map(response[0], 'exercise._id'), function(err, exerciseDates) {
                if (exerciseDates) {
                    _.forEach(response[0], function(task) {
                        if (exerciseDates[task.exercise._id]) {
                            task.initDate = exerciseDates[task.exercise._id].initDate;
                            task.endDate = exerciseDates[task.exercise._id].endDate;
                        }
                    });
                }
                res.status(200).send({
                    'tasks': response[0],
                    'count': response[1]
                });
            });
        }
    })
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
        .select('exercise student group mark status')
        .populate('exercise', 'name createdAt')
        .populate('student', 'firstName lastName username')
        .populate('group', 'name')
        .limit(parseInt(perPage))
        .skip(parseInt(perPage * page))
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(tasks);
            }
        });
};

/**
 * Get completed task by exercise and group
 * @param req
 * @param res
 */
exports.getTasksByExerciseAndGroup = function(req, res) {
    var page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage,
        userId = req.user._id,
        exerciseId = req.params.exerciseId,
        groupId = req.params.groupId,
        sortParams,
        query = {
            exercise: exerciseId,
            group: groupId,
            $or: [{
                creator: userId
            }, {
                teacher: userId
            }]
        };

    if (req.query.statusParams) {
        query = _.extend(query, JSON.parse(req.query.statusParams));
    }

    if (req.query.sortParams) {
        sortParams = JSON.parse(req.query.sortParams);
    }

    Task.find(query)
        .select('exercise student group mark status')
        .populate('exercise', 'name createdAt')
        .populate('student', 'firstName lastName username')
        .populate('group', 'name')
        .limit(parseInt(perPage))
        .skip(parseInt(perPage * page))
        .sort(sortParams)
        .exec(function(err, tasks) {
            console.log(tasks);
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json({
                'count': counter
            });
        }
    });
};

/**
 * Get count of completed task by exercise and group
 * @param req
 * @param res
 */
exports.getTasksByExerciseAndGroupCount = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId,
        groupId = req.params.groupId,
        sortParams,
        query = {
            exercise: exerciseId,
            group: groupId,
            $or: [{
                creator: userId
            }, {
                teacher: userId
            }]
        };

    if (req.query.statusParams) {
        query = _.extend(query, JSON.parse(req.query.statusParams));
    }

    if (req.query.sortParams) {
        sortParams = JSON.parse(req.query.sortParams);
    }
    Task.count(query, function(err, counter) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
    var groupId = req.params.groupId,
        studentId = req.params.studentId,
        page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage;

    Task.find({
            student: studentId,
            group: groupId
        })
        .select('exercise student group mark status')
        .populate('exercise', 'name createdAt')
        .populate('student', 'firstName lastName username')
        .populate('group', 'name')
        .limit(parseInt(perPage))
        .skip(parseInt(perPage * page))
        .exec(function(err, tasks) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                if (tasks.length > 0) {
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
                    getTasksByStudentCount(studentId, groupId, function(err, count) {
                        if (err) {
                            console.log(err);
                            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                            res.status(err.code).send(err);
                        } else {
                            res.status(200).json({
                                tasks: taskList,
                                group: tasks[0].group,
                                student: student,
                                count: count
                            });
                        }
                    });

                } else {
                    async.parallel([
                        GroupFunction.get.bind(GroupFunction, groupId),
                        UserFunctions.getUserById.bind(UserFunctions, studentId)
                    ], function(err, result) {
                        if (err) {
                            console.log(err);
                            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                            res.status(err.code).send(err);
                        } else {
                            res.status(200).json({
                                tasks: tasks,
                                group: result[0],
                                student: result[1],
                                count: 0
                            });
                        }
                    });
                }
            }
        });
};

function getTasksByStudentCount(studentId, groupId, next) {
    Task.count({
        student: studentId,
        group: groupId
    }, next);
}

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
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
                MemberFunctions.userIsHeadmaster(userId, task.group.center, function(err, isHeadmaster) {
                    if (!isHeadmaster) {
                        next({
                            code: 403,
                            message: 'Forbidden'
                        });
                    } else {
                        next(err, task);
                    }
                });
            }
        },
        function(task, next) {
            markData.mark = markData.mark ? parseFloat(markData.mark) : markData.mark;
            var updateTask = {
                remark: markData.remark
            };
            if (markData.mark) {
                updateTask.mark = markData.mark;
            }
            task.update(updateTask, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(result);
        }
    });
};

/**
 * Mark a task
 * @param req
 * @param res
 */
exports.senMark = function(req, res) {
    var userId = req.user._id,
        taskId = req.params.taskId;
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
                MemberFunctions.userIsHeadmaster(userId, task.group.center, function(err, isHeadmaster) {
                    if (!isHeadmaster) {
                        next({
                            code: 403,
                            message: 'Forbidden'
                        });
                    } else {
                        next(err, task);
                    }
                });
            }
        },
        function(task, next) {
            task.update({
                status: 'corrected'
            }, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
    async.waterfall([
        Task.findOne.bind(Task, {
            _id: taskId,
            student: userId
        }),
        function(task, next) {
            AssignmentFunction.getDateByGroupAndExercise(task.group, task.exercise, function(err, date) {
                var taskObject = task.toObject();
                if (!err) {
                    taskObject.initDate = date.initDate;
                    taskObject.endDate = date.endDate;
                }
                next(err, taskObject)
            });
        }
    ], function(err, task) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else if (!task) {
            res.sendStatus(404);
        } else {
            var now = new Date();
            if (!task.initDate || now - task.initDate.getTime() > 0) {
                if (!task.endDate || now - task.endDate.getTime() <= 0) {
                    //can deliver
                    Task.update({
                        _id: task._id
                    }, {
                        $set: {
                            status: 'delivered'
                        }
                    }, function(err, response) {
                        if (err) {
                            console.log(err);
                            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else if (task) {
            if (String(task.student) === String(req.user._id)) {
                task.result = getResultTask(req.body);
                task.save(function(err) {
                    if (err) {
                        console.log(err);
                        err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                if (task && task.group && task.group.center) {
                    MemberFunctions.userIsHeadmaster(userId, task.group.center, function(err, isHeadmaster) {
                        if (err) {
                            console.log(err);
                            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                            res.status(err.code).send(err);
                        } else {
                            res.status(204).set({
                                'headmaster': isHeadmaster
                            }).send();
                        }
                    });
                } else {
                    res.sendStatus(404);
                }
            }
        });

};
