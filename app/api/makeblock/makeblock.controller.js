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
                'code': CodeFunctions.generateCodes()
            });
        }
    });

    Code.create(codes, function(err, result) {
        console.log('err');
        console.log(err);
        console.log('result');
        console.log(result);
    })

}
