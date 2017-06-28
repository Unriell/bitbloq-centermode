'use strict';
var ConformationToken = require('./token.model.js');

/**
 * Create confirmation token
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 */
exports.createToken = function(teacherId, centerId, next) {
    var token = new ConformationToken();
    token.generateToken(teacherId, centerId);

    token.save(function(err){
        next(err, token.token);
    });
};