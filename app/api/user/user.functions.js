'use strict';
var User = require('./user.model.js'),
    async = require('async'),
    _ = require('lodash'),
    mongoose = require('mongoose');


/**
 * Get an user
 * @param {String} email
 * @param {Function} next
 * @return {Object} user.owner
 */
exports.getUserByEmail = function(email, next) {
    User.findOne({
        email: email
    }, function(err, user) {
        if (err) {
            next(err);
        } else if (user) {
            next(err, user.owner);
        } else {
            next();
        }
    });
};

/**
 * Get users
 * @param {String} emails
 * @param {Function} next
 * @return {Array} userIds
 */
exports.getAllUsersByEmails = function(emails, next) {
    async.map(emails, exports.getUserByEmail, function(err, userIds) {
        next(err, userIds);
    });
};


/**********************************
 *** Center functions with users
 **********************************/

/**
 * Add an user in a center like teacher
 * @param {String} users
 * @param {String} centerId
 * @return {Function} next
 */
exports.addTeacher = function(user, centerId, next) {
    user.centers = user.centers || {};
    var centerExist = _.find(user.centers, function(center) {
        return String(center._id) === String(centerId);
    });
    if (!centerExist) {
        var newCenter = {
            role: 'teacher',
            date: Date.now()
        };
        user.centers[centerId] = newCenter;
        User.update({
            _id: user._id
        }, {
            centers: user.centers
        }, next);
    } else {
        next(null, user);
    }
};


/**
 * Add users in a center like teachers
 * @param {String} users
 * @param {String} centerId
 * @return {Function} next
 */
exports.addAllTeachers = function(users, centerId, next) {
    async.map(users, function(user, next) {
        exports.addTeacher(user, centerId, next);
    }, function(err, completedUsers) {
        next(err, completedUsers);
    });
};


/**
 * Add users in a center like teachers
 * @param {String} users
 * @param {String} centerId
 * @return {Function} next
 */
exports.deleteTeacher = function(userId, centerId, next) {
    async.waterfall([
        User.findById.bind(User, userId),
        function(user, next) {
            if (user.centers[centerId].role === 'teacher') {
                var userObject = user.toObject();
                delete userObject.centers[centerId];
                user.update(userObject, next);
            } else {
                next();
            }
        }
    ], next);
};


/**
 * Get all teachers in a center
 * @param {String} centerId
 * @param {Function} next
 * @return {Array} teachers
 */
exports.getAllTeachers = function(centerId, next) {
    User.find({})
        .select('_id username firstName lastName email')
        .where('centers.' + centerId + '.role').equals('teacher')
        .exec(next);
};


/**
 * if user is center admin, get the center information.
 * @param {String} userId
 * @param {String} centerId
 * @return {Function} next
 */
exports.userIsHeadMaster = function(userId, centerId, next) {
    User.findById(userId, function(err, user) {
        if (err) {
            next(err)
        } else {
            if (user.isHeadMaster(centerId)) {
                next(null, centerId);
            } else {
                next(401);
            }
        }
    });
};

/**
 * Returns if a user is head master
 * @param user Id
 */
exports.getCenterIdbyHeadMaster = function(userId, next) {
    User.findById(userId, function(err, user) {
        if (err) {
            res.status(err.code).send(err);
        } else {
            var centerId;
            if (user) {
                centerId = user.getHeadMasterCenter();
            }
            next(null, centerId);
        }
    });
};
