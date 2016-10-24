'use strict';

var UserFunctions = require('../user/user.functions.js'),
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
        UserFunctions.getCenterWithUserAdmin.bind(UserFunctions, userId, centerId),
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
        UserFunctions.getCenterWithUserAdmin.bind(UserFunctions, userId, centerId),
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
