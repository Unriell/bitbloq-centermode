'use strict';
var Member = require('./member.model.js'),
    GroupFunctions = require('../group/group.functions'),
    CenterFunctions = require('../center/center.functions'),
    ConfirmationTokenFunctions = require('../teacherConfirmation/token.functions'),
    async = require('async'),
    mongoose = require('mongoose'),
    mailer = require('../../components/mailer'),
    config = require('../../res/config.js'),
    _ = require('lodash');

/**
 * Add an member in a center like head master
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 */
exports.addHeadmaster = function(userId, centerId, next) {
    _addStaff(userId, centerId, 'headmaster', next);
};

/**
 * Add an member in a center like student
 * @param {String} userId
 * @param {String} groupId
 * @param {Function} next
 */
exports.addStudent = function(userId, groupId, next) {
    async.waterfall([
        Member.findOne.bind(Member, {
            user: userId,
            group: groupId,
            role: 'student'
        }),
        function(member, callback) {
            if (member) {
                next();
            } else {
                var newMember = new Member({
                    user: userId,
                    group: groupId,
                    role: 'student'
                });
                newMember.save(callback);
            }
        }
    ], next);
};

/**
 * Add an member in a center like teacher
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 */
exports.addTeacher = function(userId, centerId, next) {
    _addStaff(userId, centerId, 'teacher', next);
};

/**
 * Send confirmation email to teachers
 * @param {Array} users
 * @param {String} centerId
 * @param {Function} next
 */
exports.sendConfirmationAllTeachers = function(users, centerId, next) {
    var userDontExist = [];
    async.map(users, function(user, next) {
        if (user && user._id) {
            async.parallel([
                CenterFunctions.getCenterById.bind(CenterFunctions, centerId),
                function(callback) {
                    ConfirmationTokenFunctions.createToken(user._id, centerId, callback);
                }
            ], function(err, result) {
                var center = result[0],
                    token = result[1],
                    locals = {
                        email: user.email,
                        subject: 'El centro ' + center.name + ' te invita como profesor de Bitbloq',
                        center: center.name,
                        addTeacherUrl: config.client_domain + '/#/center-mode/add-teacher/' + token
                    };
                mailer.sendOne('addTeacher', locals, function(err) {
                    if (err) {
                        userDontExist.push(user.email);
                        next(err);
                    } else {
                        CenterFunctions.addNotConfirmedTeacher(centerId, user._id, function(err, center) {
                            var result = center ? user : undefined;
                            next(err, result);
                        });
                    }
                });
            });
        } else {
            userDontExist.push(user.email);
            next();
        }
    }, function(err, completedMembers) {
        next(err, {
            teachersWaitingConfirmation: _.without(completedMembers, undefined),
            teachersWithError: !_.isEmpty(userDontExist) ? userDontExist : undefined
        });
    });
};

/**
 * Add members in a center like teachers
 * @param {String} studentId
 * @param {String} groupId
 * @param {Function} next
 */
exports.deleteStudent = function(studentId, groupId, next) {
    async.waterfall([
        Member.findOne.bind(Member, {
            user: studentId,
            group: groupId,
            role: 'student'
        }),
        function(member, next) {
            if (member) {
                member.delete(function(err) {
                    next(err);
                });
            } else {
                next();
            }
        }
    ], next);
};

/**
 * Add members in a center like teachers
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 */
exports.deleteTeacher = function(userId, centerId, next) {
    async.waterfall([
        Member.findOne.bind(Member, {
            user: userId,
            center: centerId,
            role: 'teacher'
        }),
        function(member, next) {
            if (member) {
                member.delete(next);
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
 * @return {Array} members
 */
exports.getAllTeachers = function(centerId, next) {
    Member.find({
            center: centerId,
            role: 'teacher'
        })
        .populate('user', '_id username firstName lastName email')
        .lean()
        .sort({
            createdAt: 'desc'
        })
        .exec(next);
};

/**
 * Returns center id if the user is head master
 * @param {String} userId
 * @param {Function} next
 * @return {String} center id
 */
exports.getCenterIdByHeadmaster = function(userId, next) {
    Member.findOne({
        user: userId,
        role: 'headmaster'
    }, function(err, member) {
        if (member) {
            next(err, member.center);
        } else {
            next(err, null);
        }
    });
};

/**
 * Returns center info if the user is head master
 * @param {String} userId
 * @param {Function} next
 * @return {String} center id
 */
exports.getCenterInfoByHeadmaster = function(userId, next) {
    Member.findOne({
            user: userId,
            role: 'headmaster'
        })
        .populate('center')
        .exec(function(err, member) {
            if (member) {
                next(err, member.center);
            } else {
                next(err);
            }
        });
};

/**
 * Get groups by userId as student
 * @param {String} userId
 * @param {Function} next
 * @return {String} groups
 */
exports.getGroups = function(userId, next) {
    Member.find({
            user: userId,
            role: 'student',
            group: {
                $exists: true
            }
        })
        .populate({
            path: 'group',
            populate: {
                path: 'center',
                select: 'name activatedRobots -_id'
            }
        })
        .exec(function(err, members) {
            if (members.length > 0) {
                var groups = _.map(members, 'group');
                next(err, groups);
            } else {
                next(err);
            }
        });
};

/**
 * Get my center as teacher role
 * @param {String} memberId
 * @param {Function} next
 * @return {Array} centers
 */
exports.getMyCentersAsTeacher = function(memberId, next) {
    Member.find({
            user: memberId,
            role: 'teacher'
        })
        .select('center')
        .populate('center')
        .exec(function(err, members) {
            var centers = [];
            members.forEach(function(member) {
                centers.push(member.center);
            });
            next(err, centers);
        });
};

/**
 * Get user roles in center
 *
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 * @return {Array} roles
 */
exports.getMyRolesInCenter = function(userId, centerId, next) {
    Member.find({
            user: userId,
            center: centerId
        })
        .select('role')
        .exec(function(err, members) {
            var roles = [];
            if (members.length > 0) {
                roles = _.map(members, 'role');
            }
            next(err, roles);
        });
};

/**
 * Get students in center with a teacher
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} user
 */
exports.getStudentsInCenterWithTeacher = function(teacherId, centerId, next) {
    async.waterfall([
        function(next) {
            GroupFunctions.getGroupIdsByTeacherAndCenter(teacherId, centerId, next)
        },
        function(groupIds, next) {
            Member.find({
                    role: 'student'
                })
                .where('group').in(groupIds)
                .exec(next);
        }
    ], next);
};

/**
 * Get students COUNTER in center with a teacher
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} user
 */
exports.getStudentsCounter = function(teacherId, centerId, next) {
    async.waterfall([
        function(next) {
            GroupFunctions.getGroupIdsByTeacherAndCenter(teacherId, centerId, next)
        },
        function(groupIds, next) {
            Member.find({
                    role: 'student'
                })
                .where('group').in(groupIds)
                .count(next);
        }
    ], next);
};

/**
 * Get students in center by group
 * @param {String} groupId
 * @param {Function} next
 * @return {Object} user
 */
exports.getStudentsByGroup = function(groupId, next) {
    Member.find({
            role: 'student',
            group: groupId
        })
        .populate('user', '_id firstName lastName username email')
        .exec(function(err, members) {
            var userIds = [];
            if (members.length > 0) {
                userIds = _.map(members, 'user');
            }
            next(err, userIds);
        });
};

/**
 * Get a single profile teacher
 * @param {String} teacherId
 * @param {String} centerId
 * @param {Function} next
 * @return {Object} user
 */
exports.getTeacher = function(teacherId, centerId, next) {
    Member.findOne({
            user: teacherId,
            role: 'teacher'
        })
        .populate('user', '_id firstName lastName username email role')
        .exec(function(err, member) {
            if (member) {
                next(err, member.user);
            } else {
                next(err);
            }
        });
};

/**
 * if user is head master in a center, get the center information.
 * @param {String} userId
 * @param {String} centerId
 * @param {Function} next
 */
exports.userIsHeadmaster = function(userId, centerId, next) {
    Member.find({
        user: userId,
        center: centerId,
        role: 'headmaster'
    }, function(err, members) {
        next(err, members.length > 0);
    });
};

/**
 * if user is student
 * @param {String} memberId
 * @param {Function} next
 */
exports.userIsStudent = function(memberId, next) {
    Member.findOne({
        user: memberId,
        role: 'student'
    }, function(err, member) {
        next(err, !!member);
    });
};

/**********************************
 *** Private functions
 **********************************/

function _addStaff(userId, centerId, type, next) {
    async.waterfall([
        Member.findOne.bind(Member, {
            user: userId,
            center: centerId,
            role: type
        }),
        function(member, callback) {
            if (member) {
                next({
                    code: 409,
                    message: 'Conflict. User exists as teacher in this center'
                });
            } else {
                var newMember = new Member({
                    user: userId,
                    center: centerId,
                    role: type
                });
                newMember.save(callback);
            }
        }
    ], next);
}
