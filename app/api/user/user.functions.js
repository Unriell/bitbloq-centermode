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
            console.log(email + ' no está como user');
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
exports.getAllUsersByEmails = function(emails, next) {
    async.map(emails, exports.getUserByEmail, function(err, userIds) {
        next(err, userIds);
    });
};

/**********************************
 *** Center functions with users
 **********************************/

/**
 * Add an user in a center like head master
 * @param {String} usersId
 * @param {String} centerId
 * @param {Function} next
 */
exports.addheadmaster = function(userId, centerId, next) {
    User.findById(userId, function(err, user) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            user.centers = user.centers || {};
            if (!user.centers[centerId] || (user.centers[centerId].role !== 'headmaster')) {
                var newCenter = {
                    role: 'headmaster',
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
        }
    });
};

/**
 * Add an user in a center like teacher
 * @param {String} users
 * @param {String} centerId
 * @param {Function} next
 */
exports.addTeacher = function(user, centerId, next) {
    if (user) {
        user.centers = user.centers || {};
        var centerExist = _.find(user.centers, function(center) {
            return String(center._id) === String(centerId);
        });
        if (!centerExist) {
            var newCenter = {
                role: 'teacher',
                date: Date.now()
            };
            if (!user.centers[centerId]) {
                user.centers[centerId] = newCenter;
                User.update({
                    _id: user._id
                }, {
                    centers: user.centers
                }, function(err) {
                    next(err, (new User(user)).teacherProfile);
                });
            } else {
                next();
            }
        } else {
            next(null, user);
        }
    } else {
        next();
    }
};

/**
 * Add users in a center like teachers
 * @param {String} users
 * @param {String} centerId
 * @param {Function} next
 */
exports.addAllTeachers = function(users, centerId, next) {
    var usersResult = {},
        userDontExist = [];
    async.map(users, function(user, next) {
        if (user._id) {
            exports.addTeacher(user, centerId, next);
        } else {
            userDontExist.push(user.email);
            usersResult.teachersNotAdded = userDontExist;
            next();
        }
    }, function(err, completedUsers) {
        usersResult.teachersAdded = _.pull(completedUsers, undefined);
        next(err, usersResult);
    });
};

/**
 * Add users in a center like teachers
 * @param {String} users
 * @param {String} centerId
 * @param {Function} next
 */
exports.deleteTeacher = function(userId, centerId, next) {
    async.waterfall([
        User.findById.bind(User, userId),
        function(user, next) {
            if (user && user.centers[centerId].role === 'teacher') {
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
    var sortFilters = {};
    sortFilters['centers.' + centerId + '.date'] = 'desc';

    User.find({})
        .select('_id username firstName lastName email centers')
        .where('centers.' + centerId + '.role').in(['teacher', 'headmaster'])
        .sort(sortFilters)
        .exec(next);
};

/**
 * Returns if a user is head master
 * @param {String} user Id
 * @param {Function} next
 */
exports.getCenterIdbyheadmaster = function(userId, next) {
    User.findById(userId, function(err, user) {
        var centerId;
        if (user) {
            centerId = user.getheadmasterCenter();
        }
        next(err, centerId);
    });
};

/**
 * Returns if a user is head master
 * @param {String} user Id
 * @param {Function} next
 */
exports.getCenterIdbyTeacher = function(userId, next) {
    User.findById(userId, function(err, user) {
        var centerId;
        if (user) {
            centerId = user.getLastCenterByTeacher();
        }
        next(err, centerId);
    });
};

/**
 * Ger user role in center
 *
 * @param {String} userId
 * @param {Function} next
 */
exports.getMyRoleInCenter = function(userId, centerId, next) {
    User.findById(userId, function(err, user) {
        var role;
        if (user && user.centers && user.centers && user.centers[centerId]) {
            role = user.centers[centerId].role;
        }
        next(err, role);
    });
};

/**
 * Get a single profile teacher
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 * @param {Object} user.profile
 */
exports.getTeacher = function(teacherId, centerId, next) {
    User.findById(teacherId, function(err, user) {
        var response;
        if (user && user.centers && user.centers[centerId] && (user.centers[centerId].role === 'teacher' || user.centers[centerId].role === 'headmaster')) {
            user.dateAdded = user.centers[centerId].date;
            response = user.teacherProfile;
        }
        next(err, response);
    });
};

/**
 * if user is head master in a center, get the center information.
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 */
exports.userIsHeadmaster = function(userId, centerId, next) {
    User.findById(userId, function(err, user) {
        if (err) {
            next(err);
        } else {
            if (user.isHeadmaster(centerId)) {
                next(null, centerId);
            } else {
                next(null, false);
            }
        }
    });
};

/**
 * if user is student
 * @param {String} userId
 * @param {Function} next
 */
exports.userIsStudent = function(userId, next) {
    User.findById(userId, function(err, user) {
        if (err) {
            next(err, false);
        } else {
            if (user.isStudent()) {
                next(null, true);
            } else {
                next(null, false);
            }
        }
    });
};
