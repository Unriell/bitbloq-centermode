'use strict';
var Assignment = require('./assignment.model.js'),
    TaskFunctions = require('../task/task.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    MemberFunctions = require('../member/member.functions.js'),
    ObjectId = require('mongoose').Types.ObjectId,
    _ = require('lodash'),
    async = require('async');

/**
 * Get exercises by a group
 * @param {String} exerciseIds
 * @param {Function} next
 */
exports.getAssigmentByExercises = function(exerciseIds, groupId, next) {
    var query = groupId ? {
        group: groupId
    } : {};
    Assignment.find(query)
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
 * Get exercises with specific center and teacher
 * @param {String} centerId
 * @param {String} teacherId
 * @param {Function} next
 * @return {Array} exercises
 */
exports.getExercisesByCenterTeacher = function(centerId, teacherId, next) {
    Assignment.find({})
        .select('exercise group')
        .populate('exercise')
        .populate({
            path: 'group',
            match: {
                'teacher': teacherId,
                'center': centerId
            }
        })
        .exec(function(err, assignments) {
            var exercises = [];
            assignments.forEach(function(assignment) {
                if (assignment.group) {
                    exercises.push(assignment.exercise);
                }
            });
            exercises = _.uniqBy(exercises, '_id');
            next(err, exercises);
        });
};

/**
 * Get assignment date
 * @param {String} groupId
 * @param {String} exerciseId
 * @param {Function} next
 * @return {Array} date
 */
exports.getDateByGroupAndExercise = function(groupId, exerciseId, next) {
    Assignment.find({
            group: groupId,
            exercice: exerciseId
        })
        .select('exercise initDate endDate')
        .exec(function(err, assignment) {
            next(err, {
                initDate: assignment.initDate,
                endDate: assignment.endDate
            });
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
                        endDate: assignment.endDate,
                        center: {
                            activatedRobots: result.center.activatedRobots
                        }
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
                .exec(next)
        },
        function(assignments, next) {
            assignments.forEach(function(assignment) {
                assignment.delete();
            });
            next();
        }
    ], next);
};

/**
 * assignment is removed by an group
 * @param {String} groupId
 * @param {Function} next
 */
exports.removeByGroup = function(groupId, next) {
    async.waterfall([
        function(next) {
            Assignment.find({
                    'group': groupId
                })
                .exec(next)
        },
        function(assignments, next) {
            assignments.forEach(function(assignment) {
                assignment.delete();
            });
            next();
        }
    ], next);
};

/**
 * get exercises count in group
 * @param {String} groupId
 * @param {Function} next
 */

exports.getExercisesCountInGroup = function(groupId, next) {
    Assignment.aggregate([{
            $match: {
                'group': ObjectId(groupId),
                'deleted': {
                    $ne: true
                }
            }
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
            }
        },
        {
            $count: 'count'
        }

    ], next);
};

exports.getExercisesOrdered = function(exercisesArray, query) {
    var exercisesOrdered = [];
    if (query.updatedAt) {
        exercisesOrdered = getExercisesByUpdated(exercisesArray, query.updatedAt);
    } else if (query.name) {
        exercisesOrdered = getExercisesByName(exercisesArray, query.name);
    } else if (query.initDate) {
        exercisesOrdered = getExercisesByInitDate(exercisesArray, query.initDate);
    } else {
        exercisesOrdered = exercisesArray;
    }

    if (query.status) {
        exercisesOrdered = filterExercisesByStatus(exercisesOrdered, query.status);
    }
    return exercisesOrdered;
}

function getExercisesByUpdated(exercisesArray, order) {
    return _.orderBy(exercisesArray, 'updatedAt', order);
}

function getExercisesByName(exercisesArray, order) {
    return _.orderBy(exercisesArray, function(exercise) {
        return exercise.name.toLowerCase();
    }, order);
}

function getExercisesByInitDate(exercisesArray, order) {
    return _.orderBy(exercisesArray, 'initDate', order);
}

function filterExercisesByStatus(exercisesArray, status) {
    var exercisesOpen = [],
        exercisesUnlimited = [],
        exercisesClosed = [],
        exercisesFiltered = [],
        today, assigmentEndDate, assigmentInitDate;
    _.forEach(exercisesArray, function(exercise) {
        today = new Date(),
            assigmentEndDate = new Date(exercise.endDate),
            assigmentInitDate = new Date(exercise.initDate);
        if (!exercise.endDate) {
            exercisesUnlimited.push(exercise);
        } else if (assigmentEndDate.getTime() > today.getTime() && assigmentInitDate.getTime() < today.getTime()) {
            exercisesOpen.push(exercise);
        } else if (today.getTime() > assigmentEndDate.getTime()) {
            exercisesClosed.push(exercise);
        }
    });

    switch (status) {
        case 'open':
            exercisesFiltered = exercisesOpen;
            break;
        case 'closed':
            exercisesFiltered = exercisesClosed;
            break;
        case 'withoutDate':
            exercisesFiltered = exercisesUnlimited;
            break;
    }

    return exercisesFiltered;

}
