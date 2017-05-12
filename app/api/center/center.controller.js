'use strict';

var Center = require('./center.model.js'),
    MemberFunctions = require('../member/member.functions.js'),
    async = require('async');

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
                err.code = (err.code && err.code.match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && err.code.match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
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
            err.code = (err.code && err.code.match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(centers);
        }
    });
};
