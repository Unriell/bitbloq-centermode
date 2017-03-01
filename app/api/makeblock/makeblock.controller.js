'use strict';

var Code = require('./makeblock.model.js'),
    CodeFunctions = require('./makeblock.functions.js'),
    UserFunctions = require('../user/user.functions.js'),
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
        codes = [];
    _.forEach(robots, function(robot) {
        for (var i = 0; i < number; i++) {
            codes.push({
                'robot': robot,
                'code': CodeFunctions.generateCode()
            });
        }
    });

    Code.create(codes, function(err, codes) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).json(codes);
        }
    })

}

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
}

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
        userId = req.user._id;

    // TESTING: userId = '5750561d404d59be2534af47';
    Code.findOne({
        'code': code,
        'robot': robot
    }, function(err, code) {
        var codeObject = code.toObject();
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (codeObject.used) {
            res.sendStatus(409);
        } else {
            codeObject.used = {};
            codeObject.used.user = userId;
            codeObject.used.date = new Date();
            async.parallel([
                function(next) {
                    code.update(codeObject, next);
                },
                function(next) {
                    UserFunctions.addRobotActivation(userId, robot, next)
                }
            ], function(err) {
                if (err) {
                    console.log(err);
                    err.code = parseInt(err.code) || 500;
                    res.status(err.code).send(err);
                } else {
                    res.sendStatus(200);
                }
            })
        }
    })

}
