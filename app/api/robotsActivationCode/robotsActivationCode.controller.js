'use strict';

var Code = require('./robotsActivationCode.model.js'),
    CodeFunctions = require('./robotsActivationCode.functions.js'),
    UserRobotsFunctions = require('../userrobots/userrobots.functions.js'),
    CenterFunctions = require('../center/center.functions.js'),
    async = require('async'),
    _ = require('lodash');

/**
 * Generate robot codes
 * @param req
 * @param res
 */

exports.generateCodes = function (req, res) {
    var number = parseInt(req.body.number) || 1,
        robots = req.body.robots,
        reason,
        reporter,
        type = req.body.type,
        codes = [];

    if (req.body.reason) {
        reason = req.body.reason;
    } else {
        reason = '';
    }

    if (req.body.reporter) {
        reporter = req.body.reporter;
    } else {
        reporter = '';
    }
    _.forEach(robots, function (robot) {
        for (var i = 0; i < number; i++) {
            codes.push({
                'robot': robot,
                'code': CodeFunctions.generateCode(),
                'reason': reason,
                'reporter': reporter,
                'type': type
            });
        }
    });

    Code.create(codes, function (err, codesGenerated) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codesGenerated);
        }
    });

};

exports.getCodesByRobot = function (req, res) {
    var robot = req.params.robot;
    Code.find({
        'robot': robot
    }, ['robot', 'code', 'used'], function (err, codes) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    });
};

exports.getUnusedCodesByRobot = function (req, res) {
    var robot = req.params.robot;
    Code.find({
        'robot': robot,
        'used': null
    }, ['-_id', 'robot', 'code', 'used', 'type', 'reason', 'reporter'], function (err, codes) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    })
};

exports.getUsedCodesByRobot = function (req, res) {
    var robot = req.params.robot;
    Code.find({
        'robot': robot,
        'used': {
            $ne: null
        }
    }, ['robot', 'code', 'type', 'used'], function (err, codes) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    })
};

exports.activateRobot = function (req, res) {
    var code = req.body.code,
        robot = req.body.robot,
        userId = req.user._id,
        centerId = req.body.centerId,
        type = req.body.type,
        codeFormatted;

    // TESTING: userId = '5750561d404d59be2534af47';
    if (code) {
        codeFormatted = CodeFunctions.formatCode(code);
    }
    var query = {
        'code': codeFormatted,
        'robot': robot
    };

    if (type && type === 'center') {
        query.type = type;
    }
    Code.findOne(query, function (err, codeResult) {
        if (err) {
            console.log(err);
            err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            res.status(err.code).send(err);
        } else {
            if (codeResult) {
                if (codeResult && (codeResult.used.user || codeResult.used.center)) {
                    res.sendStatus(409);
                } else {
                    async.parallel([

                        function (next) {
                            var infoUsed = {};
                            if (centerId) {
                                infoUsed = {
                                    center: centerId,
                                    date: new Date()
                                };
                            } else {
                                infoUsed = {
                                    user: userId,
                                    date: new Date()
                                };
                            }
                            codeResult.update({
                                used: infoUsed
                            }, next);
                        },

                        function (next) {
                            async.waterfall([
                                function (cb) {
                                    if (centerId) {
                                        CenterFunctions.addCenterRobot(centerId, robot, cb);
                                    } else {
                                        UserRobotsFunctions.addUserRobot(userId, robot, cb);
                                    }
                                },
                                function (cb) {
                                    if (centerId) {
                                        CenterFunctions.getCenterById(centerId, cb);
                                    } else {
                                        UserRobotsFunctions.getUserRobots(userId, cb);
                                    }
                                }
                            ], next);
                        }], function (err, result) {
                            if (err) {
                                console.log(err);
                                err.code = (err.code && String(err.code).match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
                                res.status(err.code).send(err);
                            } else {
                                res.status(200).json(result[1]);
                            }
                        });
                }
            } else {
                res.sendStatus(404);
            }

        }
    })

};
