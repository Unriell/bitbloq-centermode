'use strict';

var Member = require('./member.model.js'),
    MemberFunctions = require('./member.functions.js'),
    CenterFunctions = require('../center/center.functions.js'),
    UserFunctions = require('../user/user.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    TaskFunctions = require('../task/task.functions.js'),
    AssignmentFunction = require('../assignment/assignment.functions.js'),
    ConfirmationTokenFunctions = require('../teacherConfirmation/token.functions'),
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            if (!result[0]) {
                res.sendStatus(403);
            } else {
                MemberFunctions.sendConfirmationAllTeachers(result[1], centerId, function(err, teachers) {
                    if (err) {
                        console.log(err);
                        err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
 * A teacher confirm his integration with a center
 * @param req
 * @param req.user
 * @param req.body.token
 * @param res
 */
exports.confirmTeacher = function(req, res) {
    var userId = req.user._id;
    if (req.body.token) {
        async.waterfall([
            ConfirmationTokenFunctions.getInfo.bind(ConfirmationTokenFunctions, req.body.token),
            function(token, next) {
                if (token && userId == token.teacherId) {
                    MemberFunctions.addTeacher(token.teacherId, token.centerId, function(err) {
                        next(err, token);
                    });
                } else {
                    next({
                        code: 403,
                        message: 'Forbidden'
                    });
                }
            },
            function(token, next) {
                CenterFunctions.deleteNotConfirmedTeacher(token.centerId, token.teacherId, next);
            }
        ], function(err, center) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(center.name);
            }
        });
    } else {
        res.sendStatus(400);
    }
};

/**
 * An invitation is resent
 * @param req
 * @param req.user
 * @param req.body.teacherId
 * @param req.body.centerId
 * @param res
 */
exports.sendInvitation = function(req, res) {
    var teacherId = req.body.teacherId,
        centerId = req.body.centerId;
    if (teacherId && centerId) {
        async.waterfall([
            function(next) {
                CenterFunctions.isNotConfirmedTeacher(centerId, teacherId, next);
            },
            function(isNotConfirmedTeacher, next) {
                if (isNotConfirmedTeacher) {
                    UserFunctions.getUserById(teacherId, next);
                } else {
                    next({
                        code: 404,
                        message: 'Not Found'
                    });
                }
            },
            function(teacher, next) {
                MemberFunctions.sendConfirmationAllTeachers([teacher], centerId, next);
            }
        ], function(err, teachers) {
            if (err) {
                console.log(err);
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                res.status(err.code).send(err);
            } else {
                res.status(200).send(teachers);
            }
        });
    } else {
        res.sendStatus(400);
    }
};

/**
 * Activate student mode
 * @param req
 * @param res
 */
exports.activateStudentMode = function(req, res) {
    var userId = req.user._id;
    var newStudent = new Member({
        user: userId,
        role: 'student'
    });

    newStudent.save(function(err) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
        }
    });
};

/**
 * Delete a teacher invitation if user is head master
 * @param req
 * @param req.params.teacherId
 * @param req.params.centerId
 * @param res
 */
exports.deleteInvitation = function(req, res) {
    var userId = req.user._id,
        teacherId = req.params.teacherId,
        centerId = req.params.centerId;
    async.waterfall([
        function(next) {
            MemberFunctions.userIsHeadmaster(userId, centerId, next);
        },
        function(isHeadmaster, next) {
            if (isHeadmaster) {
                CenterFunctions.deleteNotConfirmedTeacher(centerId, teacherId, next);
            } else {
                next({
                    code: 403,
                    message: 'Forbidden'
                });
            }
        }
    ], function(err) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
        }
    });
};

/**
 * Delete a student if user is group teacher
 * @param req
 * @param res
 */
exports.deleteStudent = function(req, res) {
    var userId = req.user._id,
        studentId = req.params.studentId,
        groupId = req.params.groupId;
    async.parallel([
        MemberFunctions.deleteStudent.bind(MemberFunctions, studentId, groupId),
        function(next) {
            TaskFunctions.delete(groupId, studentId, userId, next);
        }
    ], function(err) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
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
                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
                        err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else if (members.length > 0) {
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
    var userId = req.user._id;
    Member.find({
        user: userId
    }, function(err, members) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
                CenterFunctions.getNotConfirmedTeacher(centerId, next);
            }
        },
        function(notConfirmedTeachers, next) {
            var users = [];
            _.forEach(notConfirmedTeachers, function(teacher) {
                teacher.notConfirmed = true;
                users.push({
                    user: teacher
                });
            });
            MemberFunctions.getAllTeachers(centerId, function(err, members) {

                if (members) {
                    users = _.concat(members, users);
                }
                next(err, users);
            });
        },
        function(members, next) {
            async.map(members, function(member, next) {
                CenterFunctions.getStats(member.user, centerId, next);
            }, next);
        }
    ], function(err, teachers) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else if (!teachers) {
            res.sendStatus(304);
        } else {
            res.send(teachers);
        }
    });
};

/**
 * Register a student in a group
 * @param req
 * @param req.body.groupId
 * @param res
 */
exports.registerInGroup = function(req, res) {
    var userId = req.user._id,
        accessId = req.body.accessId;

    async.waterfall([
        GroupFunctions.getOpenGroup.bind(GroupFunctions, accessId),
        function(group, next) {
            if (group) {
                MemberFunctions.addStudent(userId, group._id, function(err, member) {
                    next(err, group);
                });
            } else {
                next({
                    code: 403,
                    message: 'Forbidden'
                });
            }
        },
        function(group, next) {
            AssignmentFunction.createTasksToStudent(group._id, userId, next);
        }
    ], function(err) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.sendStatus(200);
        }
    });
};
