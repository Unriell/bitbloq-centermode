'use strict';

var Code = require('./robotsActivationCode.model.js'),
    CodeFunctions = require('./robotsActivationCode.functions.js'),
    UserRobotsFunctions = require('../userrobots/userrobots.functions.js'),
    async = require('async'),
    _ = require('lodash');

/**
 * Generate robot codes
 * @param req
 * @param res
 */

exports.generateCodes = function(req, res) {
    var number = req.body.number,
        robots = req.body.robots,
        reason,
        codes = [];

    if (req.body.reason) {
        reason = req.body.reason;
    } else {
        reason = '';
    }
    _.forEach(robots, function(robot) {
        for (var i = 0; i < number; i++) {
            codes.push({
                'robot': robot,
                'code': CodeFunctions.generateCode(),
                'reason': reason
            });
        }
    });

    Code.create(codes, function(err, codesGenerated) {
        console.log('codes');
        console.log(codesGenerated);
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codesGenerated);
        }
    })

};

exports.getCodesByRobot = function(req, res) {
    var robot = req.params.robot;
    Code.find({
        'robot': robot
    }, ['robot', 'code', 'used'], function(err, codes) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    });
};

exports.getUnusedCodesByRobot = function(req, res) {
    var robot = req.params.robot;
    Code.find({
        'robot': robot,
        'used': null
    }, ['robot', 'code', 'used'], function(err, codes) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    })
};

exports.getUsedCodesByRobot = function(req, res) {
    var robot = req.params.robot;
    Code.find({
        'robot': robot,
        'used': {
            $ne: null
        }
    }, ['robot', 'code', 'used'], function(err, codes) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    })
};

exports.activateRobot = function(req, res) {
    var code = req.body.code,
        robot = req.body.robot,
        userId = req.user._id,
        codeFormatted;

    // TESTING: userId = '5750561d404d59be2534af47';
    if (code) {
        codeFormatted = CodeFunctions.formatCode(code);
    }

    Code.findOne({
        'code': codeFormatted,
        'robot': robot
    }, function(err, codeResult) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            if (codeResult) {
                if (codeResult && codeResult.used.user) {
                    res.sendStatus(409);
                } else {
                    async.parallel([
                        function(next) {
                            codeResult.update({
                                used: {
                                    user: userId,
                                    date: new Date()
                                }
                            }, next);
                        },
                        function(next) {
                            UserRobotsFunctions.addUserRobot(userId, robot, next);
                        }
                    ], function(err) {
                        if (err) {
                            console.log(err);
                            err.code = parseInt(err.code) || 500;
                            res.status(err.code).send(err);
                        } else {
                            UserRobotsFunctions.getUserRobots(userId, function(error, result) {
                                if (error) {
                                    console.log(error);
                                    error.code = parseInt(error.code) || 500;
                                    res.status(error.code).send(error);
                                } else {
                                    res.status(200).json(result);
                                }
                            });
                        }
                    });
                }
            } else {
                res.sendStatus(404);
            }

        }
    })

};
