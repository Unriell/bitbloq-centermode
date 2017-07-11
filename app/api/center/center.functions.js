'use strict';
var MemberFunctions = require('../member/member.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    Center = require('./center.model.js'),
    async = require('async');

/**
 * Get teacher  stats.
 * @param {Object} teacher
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} teacher
 */
exports.getStats = function(teacher, centerId, next) {
    async.parallel([
        MemberFunctions.getStudentsCounter.bind(MemberFunctions, teacher._id, centerId),
        GroupFunctions.getCounter.bind(GroupFunctions, teacher._id, centerId)
    ], function(err, result) {
        if (!err) {
            teacher.students = result[0];
            teacher.groups = result[1];
        }
        console.log('teacher');
        console.log(teacher);
        next(err, teacher);
    });
};

/**
 * Get information center in array
 * @param {Array} centerIds
 * @param {Function} next
 * @return {Object} center
 */
exports.getCentersInArray = function(centerIds, next) {
    Center.find()
        .where('_id').in(centerIds)
        .exec(next);
};

exports.getCenterById = function(centerId, next) {
    Center.findById(centerId, next);
};

exports.addCenterRobot = function(centerId, robot, next) {
    Center.update({
            _id: centerId
        }, {
            $addToSet: {
                activatedRobots: robot.split('-')[0]
            }
        },
        next
    );
};

exports.addNotConfirmedTeacher = function(centerId, teacherId, next) {
    Center.findById(centerId, function(err, center) {
        if (err) {
            next(err);
        } else {
            if (center.notConfirmedTeacher.indexOf(teacherId) === -1) {
                center.notConfirmedTeacher.push(teacherId);
                center.save(next);
            } else {
                next();
            }
        }
    });
};

exports.getNotConfirmedTeacher = function(centerId, next) {
    Center.findById(centerId)
        .select('notConfirmedTeacher')
        .populate('notConfirmedTeacher', '_id username firstName lastName email')
        .lean()
        .exec(function(err, center) {
            if (center) {
                next(err, center.notConfirmedTeacher);
            } else {
                next(err);
            }
        });
};

exports.isNotConfirmedTeacher = function(centerId, teacherId, next) {
    Center.findById(centerId)
        .select('notConfirmedTeacher')
        .exec(function(err, center) {
            if (center) {
                if (center.notConfirmedTeacher && center.notConfirmedTeacher.indexOf(teacherId) > -1) {
                    next(err, true);
                } else {
                    next(err, false);
                }
            } else {
                next(err, false);
            }
        });
};

exports.deleteNotConfirmedTeacher = function(centerId, teacherId, next) {
    Center.findById(centerId, function(err, center) {
        if (err) {
            next(err);
        } else {
            var index = center.notConfirmedTeacher.indexOf(teacherId);
            if (index !== -1) {
                center.notConfirmedTeacher.splice(index, 1);
                center.save(next);
            } else {
                next(null, center);
            }
        }
    });
};
