'use strict';
var GroupFunctions = require('../group/group.functions.js');

/**
 * Get teacher  stats.
 * @param {Object} teacher
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} teacher
 */
exports.getStats = function(teacher, centerId, next) {
    GroupFunctions.getGroups(teacher, centerId, function(err, groups) {
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

exports.teacherGetDateByCenterId = function(teachers, centerId) {
    var teacherArray = [];
    teachers.forEach(function(teacher) {
        var teacherObject = teacher.toObject();
        teacherObject.dateCreated = teacherObject.centers[centerId].date;
        delete teacherObject.centers;
        teacherArray.push(teacherObject);
    });
    return teacherArray;
};
