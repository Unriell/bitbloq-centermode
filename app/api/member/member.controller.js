'use strict';

var Member = require('./member.model.js'),
    MemberFunctions = require('./member.functions.js'),
    CenterFunctions = require('../center/center.functions.js'),
    UserFunctions = require('../user/user.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    async = require('async'),
    _ = require('lodash');


/**
 * Add teacher in a center
 * @param req
 * @param req.body.teachers
 * @param req.body.centerId
 * @param res
 */
exports.addTeacher = function(req, res) {
    var userId = req.user._id,
        newTeacherEmails = req.body.teachers,
        centerId = req.body.centerId;
    async.parallel([
        MemberFunctions.userIsHeadmaster.bind(MemberFunctions, userId, centerId),
        UserFunctions.getUsersByEmails.bind(UserFunctions, newTeacherEmails)
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            if (!result[0]) {
                res.sendStatus(403);
            } else {
                MemberFunctions.addAllTeachers(result[1], centerId, function(err, teachers) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else {
                        res.status(200).send(teachers);
                    }
                });
            }
        }
    });
};

/**
 * Delete a teacher in a center
 * @param req
 * @param res
 */
exports.deleteTeacher = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId,
        teacherId = req.params.teacherId;
    if (userId.toString() !== teacherId.toString()) {
        MemberFunctions.userIsHeadmaster(userId, centerId, function(err, isHeadmaster) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (isHeadmaster) {
                async.waterfall([
                    GroupFunctions.deleteGroups.bind(GroupFunctions, teacherId, centerId),
                    function(groups, next) {
                        TaskFunctions.deleteByTeacherAndGroups(teacherId, groups, next);
                    },
                    MemberFunctions.deleteTeacher.bind(MemberFunctions, teacherId, centerId)
                ], function(err, result) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else if (!result) {
                        res.sendStatus(304);
                    } else {
                        res.sendStatus(200);
                    }
                });
            } else {
                res.sendStatus(403);
            }
        });
    } else {
        res.sendStatus(409);
    }
};

/**
 * Returns if a Member is head master
 * @param req
 * @param res
 */
exports.isHeadmaster = function(req, res) {
    var userId = req.user._id;
    Member.find({
        user: userId,
        role: 'headmaster'
    }, function(err, members) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (result) {
            res.status(200).json({
                center: members[0].center
            });
        } else {
            res.status(204).json({
                message: 'User is not head master'
            });
        }
    });
};


/**
 * Get user role
 * @param req
 * @param res
 */
exports.getMyRole = function(req, res) {
    console.log('en getMy role');
    var userId = req.user._id;
    Member.find({
        user: userId
    }, function(err, members) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (members.length > 0) {
            var roles = _.map(members, 'role'),
                role = '';
            if (roles.indexOf('headmaster') > -1) {
                role = 'headmaster';
            } else if (roles.indexOf('teacher') > -1) {
                role = 'teacher';
            } else {
                role = 'student';
            }
            res.status(200).send(role);
        } else {
            res.sendStatus(204);
        }
    });
};


/**
 * Get a teacher
 * @param req
 * @param req.params.teacherId
 * @param req.params.centerId
 * @param res
 */
exports.getTeacher = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId,
        teacherId = req.params.teacherId;
    async.waterfall([
        MemberFunctions.userIsHeadmaster.bind(MemberFunctions, userId, centerId),
        function(isHeadmaster, next) {
            if (!isHeadmaster) {
                next({
                    code: 403,
                    message: 'Forbidden'
                });
            } else {
                MemberFunctions.getTeacher(teacherId, centerId, next);
            }
        }
    ], function(err, teacher) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!teacher) {
            res.sendStatus(404);
        } else {
            res.send(teacher);
        }
    });
};


/**
 * Get teachers in a center
 * @param req
 * @param res
 */
exports.getTeachers = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId;
    async.waterfall([
        MemberFunctions.userIsHeadmaster.bind(MemberFunctions, userId, centerId),
        function(isHeadmaster, next) {
            if (!isHeadmaster) {
                next({
                    code: 401,
                    message: 'Forbidden'
                });
            } else {
                MemberFunctions.getAllTeachers(centerId, function(err, members) {
                    next(err, members, centerId);
                });
            }
        },
        function(members, centerId, next) {
            async.map(members, function(member, next) {
                CenterFunctions.getStats(member.user, centerId, next);
            }, next);
        }
    ], function(err, teachers) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!teachers) {
            res.sendStatus(304);
        } else {
            res.send(teachers);
        }
    });
};
