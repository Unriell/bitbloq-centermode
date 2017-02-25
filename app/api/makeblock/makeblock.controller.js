'use strict';

var Code = require('./makeblock.model.js'),
    CodeFunctions = require('./makeblock.functions.js'),
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
