'use strict';
var UserRobots = require('./userrobots.model.js'),
    _ = require('lodash');

exports.addUserRobot = function (userId, robot, next) {
    var userrobot = new UserRobots({
        'userId': userId,
        'robot': robot,
        'activated': true
    });
    userrobot.save(function (err) {
        next(err);
    });
};

exports.getUserRobots = function (userId, next) {
    UserRobots.find({
        userId: userId
    })
        .select('robot activated')
        .exec(function (err, userRobots) {
            var robotsResponse = exports.formatRobotResponse(userRobots);
            next(err, robotsResponse);
        });

};

exports.formatRobotResponse = function (robotResponse) {
    var robotObject = {};
    _.forEach(robotResponse, function (robotElement) {
        robotObject[robotElement.robot] = {
            'activated': robotElement.activated
        };
    });

    return robotObject;
};
