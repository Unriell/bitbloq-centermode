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
        var teacherObject = teacher.toObject();
        if (!err) {
            teacherObject.students = result[0];
            teacherObject.groups = result[1];
        }
        next(err, teacherObject);
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
