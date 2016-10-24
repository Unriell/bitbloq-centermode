'use strict';
var User = require('./user.model.js'),
    async = require('async'),
    _ = require('lodash'),
    mongoose = require('mongoose');



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
    user.centers = user.centers || [];
    var centerExist = _.find(user.centers, function(center) {
        return String(center._id) === String(centerId);
    });
    if (!centerExist) {
        var newCenter = {
            _id: centerId,
            role: 'teacher'
        };
        user.centers.push(newCenter);
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
            var indexArray;
            user.centers.forEach(function(center, index) {
                if (String(center._id) === String(centerId) && center.role === 'teacher') {
                    indexArray = index;
                }
            });
            if (indexArray > -1) {
                user.centers.splice(indexArray, 1);
            }
            user.update(user, next);
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
        .elemMatch("centers", {
            _id: centerId,
            role: 'teacher'
        }).exec(next);
};


/**
 * if user is center admin, get the center information.
 * if centerId isn't an attribute, it returns first center that user is admin
 * @param {String} userId
 * @param {String} centerId
 * @return {Function} next
 */
exports.getCenterWithUserAdmin = function(userId, centerId, next) {
    async.waterfall([
        User.findById.bind(User, userId),
        function(user, next) {
            var myCenterId;
            _.forEach(user.centers, function(center) {
                if ((centerId && String(center._id) === String(centerId) && center.role === 'headMaster') || (!centerId && center.role === 'headMaster')) {
                    myCenterId = center._id;
                    next(null, myCenterId);
                }
            });
            if (!myCenterId) {
                next(401);
            }
        }
    ], function(err, result) {
        next(err, result);
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
            if (user && user.centers) {
                user.centers.forEach(function(center) {
                    if (center.role === 'headMaster') {
                        centerId = center._id;
                    }
                });
            }
            next(null, centerId);
        }
    });
};
