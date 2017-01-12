'use strict';
var Group = require('./group.model.js'),
    UserFunctions = require('../user/user.functions.js'),
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
            UserFunctions.getMyRoleInCenter(teacherId, centerId, callBack);
        },
        function(role, callBack) {
            if (role === 'teacher' || role === 'headMaster') {
                Group.remove({
                    teacher: teacherId,
                    center: centerId
                }, callBack);
            } else {
                callBack(401);
            }
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
 * @param {String} teacherId
 * @param {String} centerId
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
                UserFunctions.userIsHeadMaster(userId, group.center, function(err) {
                    if (err) {
                        next(err);
                    } else {
                        next(null, group.students);
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
