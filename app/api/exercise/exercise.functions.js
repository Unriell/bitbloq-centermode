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
