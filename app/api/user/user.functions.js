'use strict';
var User = require('./user.model.js'),
    async = require('async'),
    _ = require('lodash');

/**
 * Get an user
 * @param {String} userId
 * @param {Function} next
 * @return {Object} user.owner
 */
exports.getUserById = function(userId, next) {
    User.findById(userId, function(err, user) {
        next(err, user.owner);
    });
};

/**
 * Get an user
 * @param {String} email
 * @param {Function} next
 * @return {Object} user.owner
 */
exports.getUserByEmail = function(email, next) {
    email = email.toLowerCase();
    User.findOne({
        email: email
    }, function(err, user) {
        if (err) {
            next(err);
        } else if (user) {
            next(err, user.owner);
        } else {
            next(err, {
                'email': email
            });
        }
    });
};

/**
 * Get users
 * @param {String} emails
 * @param {Function} next
 * @return {Array} userIds
 */
exports.getUsersByEmails = function(emails, next) {
    async.map(emails, exports.getUserByEmail, function(err, userIds) {
        next(err, userIds);
    });
};
