'use strict';

var Center = require('./center.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
    CenterFunctions = require('./center.functions.js'),
    async = require('async'),
    _ = require('lodash');


/**
 * Create center
 * @param req
 * @param res
 */
exports.createCenter = function(req, res) {
    var userId = req.user._id,
        center = req.body;
    if (center && center.name && center.location && center.telephone) {
        center.creator = userId;
        var newCenter = new Center(center);
        async.waterfall([
            newCenter.save.bind(newCenter, center),
            function(savedCenter, updated, next) {
                async.parallel([
                    MemberFunctions.addHeadmaster.bind(MemberFunctions, userId, savedCenter._id),
                    MemberFunctions.addTeacher.bind(MemberFunctions, userId, savedCenter._id)
                ], next);
            }
        ], function(err, result) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (result) {
                res.sendStatus(200);
            } else {
                res.sendStatus(204);
            }
        });
    } else {
        var centerError = '';
        if (!center) {
            centerError = 'No center data provided';
        } else {
            if (!center.name) {
                centerError = 'No center name provided';
            } else if (!center.location) {
                centerError = 'No center location provided';
            } else if (!center.telephone) {
                centerError = 'No center telephone provided';
            }
        }
        res.status(400).send(centerError);
    }

};

/**
 * Get my center, if user is head master
 * @param req
 * @param res
 */
exports.getMyCenter = function(req, res) {
    var userId = req.user._id;
    MemberFunctions.getCenterInfoByHeadmaster(userId, function(err, center) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            if (center) {
                res.status(200).send(center);
            } else {
                res.sendStatus(204);
            }
        }
    });
};

/**
 * Get my centers, if user is teacher
 * @param req
 * @param res
 */
exports.getMyCenters = function(req, res) {
    var userId = req.user._id;
    MemberFunctions.getMyCentersAsTeacher(userId, function(err, centers) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(centers);
        }
    });
};

/**
 * Get a teacher
 * @param req
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
