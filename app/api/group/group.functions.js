'use strict';
var Group = require('./group.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
    _ = require('lodash'),
    async = require('async');

/**
 * Delete all groups of teacher in a center
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} user.owner
 */
exports.deleteGroups = function(teacherId, centerId, next) {
    async.waterfall([
        function(callBack) {
            MemberFunctions.getMyRolesInCenter(teacherId, centerId, callBack);
        },
        function(roles, callBack) {
            if (roles.indexOf('teacher') > -1 || roles.indexOf('headmaster') > -1) {
                Group.find({
                        teacher: teacherId,
                        center: centerId
                    })
                    .select('_id')
                    .exec(callBack);
            } else {
                callBack({
                    code: 401,
                    message: 'Unauthorized'
                });
            }
        },
        function(groups, callBack) {
            async.map(groups, function(group, next) {
                group.delete(next);
            }, function(err) {
                callBack(err, groups);
            });
        }
    ], next);
};

/**
 * Get all groups of teacher in a center
 * @param {String} accessId
 * @param {Function} next
 */
exports.getOpenGroup = function(accessId, next) {
    Group.findOne({
        accessId: accessId,
        status: 'open'
    }, next);
};

/**
 * Get all groups of teacher in a center
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 */
exports.getGroups = function(teacherId, centerId, next) {
    Group.find({
        teacher: teacherId,
        center: centerId
    }, next);
};

/**
 * Get group ids by teacher in a center
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 */
exports.getGroupIdsByTeacherAndCenter = function(teacherId, centerId, next) {
    Group.find({
        teacher: teacherId,
        center: centerId
    }, function(err, groups) {
        next(err, _.map(groups, '_id'));
    });
};

/**
 * Get group counter of groups with a determinate teacher in a center
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 */
exports.getCounter = function(teacherId, centerId, query, next) {
    var counterQuery = {
        teacher: teacherId,
        center: centerId
    };

    if (query) {
        counterQuery = _.extend(counterQuery, query);
    }

    Group.find(counterQuery).count(next);
};

/**
 * Get user role all groups of teacher in a center
 * @param {String} groupId
 * @param {String} userId
 * @param {Function} next
 */
exports.getStudents = function(groupId, userId, next) {
    Group.findById(groupId, function(err, group) {
        if (err) {
            next(err);
        } else if (group) {
            if (String(group.teacher) === String(userId)) {
                next(null, group.students);
            } else {
                MemberFunctions.userIsHeadmaster(userId, group.center, function(err, isHeadmaster) {
                    if (!isHeadmaster) {
                        next({
                            code: 403,
                            message: 'Forbidden'
                        });
                    } else {
                        next(err, group.students);
                    }
                });
            }
        } else {
            next({
                code: 404,
                message: 'Not Found'
            });
        }
    });
};

/**
 * Get group name
 * @param {String} groupId
 * @param {Function} next
 * @return {Object} group._id group.name
 */
exports.get = function(groupId, next) {
    Group.findById(groupId)
        .select('name center')
        .populate('center', 'activatedRobots')
        .exec(next);
};
