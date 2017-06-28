'use strict';
var config = require('../../res/config.js'),
    jwt = require('jsonwebtoken');

/**
 * Create confirmation token
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 */
exports.createToken = function(teacherId, centerId, next) {
    var token = jwt.sign({
        _id: this._id,
        teacherId: teacherId,
        centerId: centerId
    }, config.secrets.session, {});

    next(null, token);
};


/**
 * Get confirmation token
 * @param {String} token
 * @param {Function} next
 */
exports.getInfo = function(token, next){
    jwt.verify(token, config.secrets.session, next);
};