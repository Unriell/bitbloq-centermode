'use strict';

var Center = require('./center.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    async = require('async');

/**
 * Create center
 * @param req
 * @param res
 */
exports.addTeacher = function(req, res) {
    var userId = req.user._id,
        newTeacherEmails = req.body,
        centerId = req.params.centerId;
    async.parallel([
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        UserFunctions.getAllUsersByEmails.bind(UserFunctions, newTeacherEmails)
    ], function(err, result) {
        if (err) {
            console.log(err);
            res.sendStatus(401);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            UserFunctions.addAllTeachers(result[1], result[0], function(err, newuser) {
                if (err) {
                    console.log(err);
                    err.code = parseInt(err.code) || 500;
                    res.status(err.code).send(err);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
};


/**
 * Create center
 * @param req
 * @param res
 */
exports.createCenter = function(req, res) {
    var userId = req.user._id,
        center = req.body;
    center.creator = userId;
    var newCenter = new Center(center);
    async.waterfall([
        function(next) {
            newCenter.save(center, next);
        },
        function(savedCenter, updated, next) {
            UserFunctions.addHeadMaster(userId, savedCenter._id, next);
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
    async.waterfall([
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        function(centerId, next) {
            GroupFunctions.deleteGroups(teacherId, centerId, next);
        },
        function(updated, next) {
            UserFunctions.deleteTeacher(teacherId, centerId, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            res.sendStatus(401);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            res.sendStatus(200);
        }
    });
};


/**
 * Get my center, if user is head master
 * @param req
 * @param res
 */
exports.getMyCenter = function(req, res) {
    var userId = req.user._id;
    async.waterfall([
        UserFunctions.getCenterIdbyHeadMaster.bind(UserFunctions, userId),
        function(centerId, next) {
            Center.findById(centerId, next);
        }
    ], function(err, center) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (center) {
            res.send(center);
        } else {
            res.sendStatus(204);
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
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        function(centerId, next) {
            UserFunctions.getTeacher(teacherId, centerId, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            res.sendStatus(401);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            res.send(result);
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
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        function(centerId, next) {
            UserFunctions.getAllTeachers(centerId, next);
        }
    ], function(err, result) {
        if (err) {
            console.log(err);
            res.sendStatus(401);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            res.send(result);
        }
    });
};

/**
 * Get center
 * @param req
 * @param res
 */
exports.getCenter = function(req, res) {

};


/**
 * Update center information
 * @param req
 * @param res
 */
exports.updateCenter = function(req, res) {

};

/**
 * Make anonymous a center if user is owner
 * @param req
 * @param res
 */
exports.anonCenter = function(req, res) {

};
