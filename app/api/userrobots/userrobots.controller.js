'use strict';

var UserRobotsFunctions = require('./userrobots.functions.js');

/**
 * Get User Robots
 * @param req
 * @param res
 */

exports.getUserRobots = function(req, res) {
    var userId = req.params.userId;

    UserRobotsFunctions.getUserRobots(userId, function(err, robots) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            res.status(200).send(robots);
        }
    });

};
