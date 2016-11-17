'use strict';

var User = require('./user.model.js'),
    UserFunctions = require('./user.functions.js'),
    _ = require('lodash');


/**
 * Returns if a user is head master
 * @param req
 * @param res
 */
exports.isHeadMaster = function (req, res) {
    var userId = req.user._id;
    UserFunctions.getCenterIdbyHeadMaster(userId, function (err, result) {
        if (err) {
            console.log(err);
            res.status(err.code).send(err);
        } else if (result) {
            res.sendStatus(200);
        } else {
            res.sendStatus(204);
        }
    });
};


/**
 * Get user role
 * @param req
 * @param res
 */
exports.getMyRole = function (req, res) {
    var userId = req.user._id;
    User.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            res.status(err.code).send(err);
        } else if (user) {
            if (user.centers) {
                var role = 'student';
                _.forEach(user.centers, function (center) {
                    switch (center.role) {
                        case 'headMaster':
                            role = center.role;
                            break;
                        case 'teacher':
                            if (role != 'headMaster') {
                                role = center.role;
                            }
                            break;
                    }
                });
                res.status(200).send(role);
            } else {
                res.sendStatus(204);
            }
        } else {
            res.sendStatus(204);
        }
    });
};
