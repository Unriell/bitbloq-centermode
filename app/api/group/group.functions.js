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
