'use strict';
var GroupFunctions = require('../group/group.functions.js'),
    Center = require('./center.model.js');

/**
 * Get teacher  stats.
 * @param {Object} teacher
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} teacher
 */
exports.getStats = function(teacher, centerId, next) {
    GroupFunctions.getGroups(teacher._id, centerId, function(err, groups) {
        var teacherObject = teacher;
        teacherObject.students = 0;
        if (groups) {
            teacherObject.groups = groups.length;
        }
        groups.forEach(function(group) {
            teacherObject.students = teacherObject.students + group.students.length;
        });
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
