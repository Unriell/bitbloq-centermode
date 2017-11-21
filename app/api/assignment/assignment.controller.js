'use strict';

var Assignment = require('./assignment.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
    AssignmentFunctions = require('./assignment.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    mongoose = require('mongoose'),
    ObjectId = require('mongoose').Types.ObjectId,
    _ = require('lodash'),
    maxPerPage = 10,
    async = require('async');

/**
 * An exercise is assigned to group
 * @param {Object} req
 * @param {String} req.params.exerciseId
 * @param {Object} req.body.assign
 * @param {Object} req.body.remove
 * @param {String} req.body.remove.groupIds
 * @param {String} req.body.remove.exerciseId
 * @param res
 */
exports.assign = function(req, res) {
    var userId = req.user._id,
        groupsToAssign = req.body.assign,
        groupsToRemove = req.body.remove;
    async.parallel([
        function(next) {
            TaskFunctions.deleteByGroupAndEx(groupsToRemove.groupIds, groupsToRemove.exerciseId, next);
        },
        function(next) {
            Assignment.find({
                    exercise: groupsToRemove.exerciseId
                })
                .where('group').in(groupsToRemove.groupIds)
                .exec(function(err, assignments) {
                    async.map(assignments, function(assignment, callBack) {
                        assignment.delete(callBack);
                    }, function(err) {
                        next(err, assignments);
                    });
                });
        },
        function(next) {
            async.map(groupsToAssign, function(assignment, next) {
                createAssignment(assignment, userId, next);
            }, next);
        },
        function(next) {
            async.map(groupsToAssign, function(assignment, next) {
                AssignmentFunctions.createTasks(assignment, userId, next)
            }, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(result[3])
        }
    });
};

/**
 * Get assigned groups by an exercise
 * @param req
 * @param {String} req.params.exerciseId
 * @param res
 */
exports.getByExercise = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId;
    async.waterfall([
        MemberFunctions.getCenterIdByHeadmaster.bind(MemberFunctions, userId),
        function(centerId, next) {
            Assignment.find({
                    exercise: exerciseId
                })
                .populate({
                    path: 'group',
                    populate: {
                        path: 'center',
                        select: 'name activatedRobots -_id'
                    }
                })
                .or([{
                    'group.center': mongoose.Schema.Types.ObjectId(centerId)
                }, {
                    'group.teacher': mongoose.Schema.Types.ObjectId(userId)
                }])
                .exec(next);
        },
        function(assignments, next) {
            var groups = [];
            assignments.forEach(function(assignment) {
                var newGroup = assignment.toObject();
                groups.push(_.extend(newGroup, newGroup.group));
                delete newGroup.group;
            });
            next(null, groups);
        }
    ], function(err, groups) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(groups);
        }
    });
};

/**
 * Get assigned groups by a group
 * @param req
 * @param {String} req.params.exerciseId
 * @param res
 */

exports.getByGroup = function(req, res) {
    var groupId = req.params.groupId,
        page = req.query.page - 1 || 0,
        perPage = (req.query.pageSize && (req.query.pageSize <= maxPerPage)) ? req.query.pageSize : maxPerPage,
        query = req.query || {},
        searchQuery = {
            'group': ObjectId(groupId),
            'deleted': {
                $ne: true
            }
        };

    async.waterfall([
            function(next) {
                Assignment.aggregate([{
                    $match: searchQuery
                }, {
                    $group: {
                        '_id': '$exercise',
                        'exercise': {
                            '$first': '$exercise'
                        }
                    }
                }, {
                    $lookup: {
                        'from': 'centermode-exercises',
                        'localField': 'exercise',
                        'foreignField': '_id',
                        'as': 'exercise'
                    },
                }], next);
            },
            function(exercises, next) {
                var exercisesArray = [];
                _.forEach(exercises, function(exercise) {
                    exercisesArray = exercisesArray.concat(exercise.exercise);
                });
                if (req.query.search) {
                    exercisesArray = _.filter(exercisesArray, function(exercise) {
                        return exercise.name.toLowerCase().indexOf(JSON.parse(req.query.search).$regex) >= 0;
                    });
                }
                if (exercisesArray.length > 0) {
                    var exercisesId = _.map(exercisesArray, '_id');
                    AssignmentFunctions.getAssigmentByExercises(exercisesId, groupId, function(err, exercisesDates) {
                        if (err) {
                            next(err, null);
                        } else {
                            var newExercises = [];
                            if (exercisesDates) {
                                exercisesArray.forEach(function(exercise) {
                                    var exerciseObject = exercise;
                                    if (exercisesDates[exercise._id]) {
                                        exerciseObject.initDate = exercisesDates[exercise._id].initDate;
                                        exerciseObject.endDate = exercisesDates[exercise._id].endDate;
                                    }
                                    newExercises.push(exerciseObject);
                                });
                                next(err, newExercises);
                            } else {
                                next(err, exercisesArray);
                            }
                        }
                    });
                } else {
                    next(null, {});
                }
            }
        ],
        function(err, response) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                var exercisesPage = [],
                    exercisesOrdered,
                    count;

                exercisesOrdered = AssignmentFunctions.getExercisesOrdered(response, query);
                count = exercisesOrdered.length;
                exercisesPage = exercisesOrdered.slice(page * perPage, (page * perPage) + perPage - 1);

                res.status(200).send({
                    'exercises': exercisesPage,
                    'count': count
                });
            }
        })
};

exports.unassign = function(req, res) {
    var userId = req.user._id,
        exerciseId = req.params.exerciseId,
        groupId = req.params.groupId;
    async.waterfall([
            function(next) {
                Assignment.findOne({
                        'group': groupId,
                        'exercise': exerciseId
                    })
                    .populate('group')
                    .exec(next)
            },
            function(assignment, next) {
                if (assignment && assignment.creator.equals(userId)) {
                    next(null, assignment);
                } else {
                    MemberFunctions.userIsHeadmaster(userId, assignment.group.center, function(err, isHeadmaster) {
                        if (isHeadmaster) {
                            next(err, assignment);
                        } else {
                            next({
                                code: 403
                            });
                        }
                    });
                }
            },
            function(assignment, next) {
                TaskFunctions.deleteByGroupAndEx([assignment.group._id], assignment.exercise, function(err) {
                    assignment.delete(next);
                });
            }
        ],
        function(err, result) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                if (!result) {
                    res.sendStatus(404);
                } else {
                    res.sendStatus(200);
                }

            }

        });
};

/* **********************************
 ******** PRIVATE FUNCTIONS *********
 * **********************************/

/**
 * create an assignment
 * @param {Object} assignment
 * @param {String} userId
 * @param {Function} next
 */
function createAssignment(assignment, userId, next) {
    Assignment.find({
            group: assignment.group,
            exercise: assignment.exercise
        })
        .populate({
            path: 'group',
            populate: {
                path: 'center',
                select: 'name activatedRobots -_id'
            }
        })
        .exec(function(err, result) {
            if (err) {
                next(err);
            } else {
                assignment.creator = userId;
                assignment.endDate = assignment.endDate || undefined;
                assignment.initDate = assignment.initDate || undefined;
                assignment.hideUntilDate = assignment.hideUntilDate || undefined;
                if (result && result.length > 0) {
                    Assignment.findOneAndUpdate({
                        group: assignment.group,
                        exercise: assignment.exercise
                    }, assignment, next);
                } else {
                    var newAssignment = new Assignment(assignment);
                    newAssignment.save(next);
                }
            }
        });
}
