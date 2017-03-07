'use strict';
var UserRobots = require('./userrobots.model.js'),
    _ = require('lodash');

exports.addUserRobot = function(userId, robot, hasCode, next) {
    var isActivated = false,
        expirationDate = new Date();
    expirationDate.setHours('23', '59', '59');
    expirationDate = expirationDate.setDate(expirationDate.getDate() + 2);
    if (hasCode) {
        isActivated = true
        expirationDate = undefined;
    }
    var userrobot = new UserRobots({
        'userId': userId,
        'robot': robot,
        'activated': isActivated,
        'expirationDate': expirationDate
    });
    userrobot.save(next);
}

exports.getUserRobots = function(userId, next) {
    UserRobots.find({
            userId: userId
        })
        .select('robot activated expirationDate')
        .exec(function(err, userRobots) {
            var robotsResponse = exports.formatRobotResponse(userRobots);
            next(err, robotsResponse);
        });

}

exports.formatRobotResponse = function(robotResponse) {
    var robotObject = {};
    _.forEach(robotResponse, function(robotElement) {
        robotObject[robotElement.robot] = {
            'expirationDate': robotElement.expirationDate,
            'activated': robotElement.activated
        };
    });

    return robotObject;
}
