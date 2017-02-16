'use strict';
var Exercise = require('./exercise.model.js');


/**
 * Get exercise by its id
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.getInfo = function(exerciseId, next) {
    Exercise.findById(exerciseId, next);
};


/**
 * Get groups by exercise
 * @param {String} exerciseId
 * @param {Function} next
 */
exports.getGroups = function(exerciseId, next) {
    Exercise.findById(exerciseId)
        .select('groups')
        .populate('groups')
        .exec(next);
};
