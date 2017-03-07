'use strict';
var Group = require('./group.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
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
            Group.remove({
                teacher: teacherId,
                center: centerId
            }, function(err) {
                callBack(err, groups);
            });
        }
    ], next);
};

/**
 * Get all groups of teacher in a center
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} user.owner
 */
exports.getGroups = function(teacherId, centerId, next) {
    Group.find({
        teacher: teacherId,
        center: centerId
    }, next);
};

/**
 * Get user role all groups of teacher in a center
 * @param {String} groupId
 * @param {String} userId
 * @param {Function} next
 * @return {Object} user.owner
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
        .select('name')
        .exec(next);
};
