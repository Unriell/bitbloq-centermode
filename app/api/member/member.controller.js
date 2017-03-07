'use strict';

var Member = require('./member.model.js'),
    _ = require('lodash');


/**
 * Returns if a Member is head master
 * @param req
 * @param res
 */
exports.isHeadmaster = function(req, res) {
    var userId = req.user._id;
    Member.find({
        user: userId,
        role: 'headmaster'
    }, function(err, members) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (result) {
            res.status(200).json({
                center: members[0].center
            });
        } else {
            res.status(204).json({
                message: 'User is not head master'
            });
        }
    });
};


/**
 * Get user role
 * @param req
 * @param res
 */
exports.getMyRole = function(req, res) {
    console.log('en getMy role');
    var userId = req.user._id;
    Member.find({
        user: userId
    }, function(err, members) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (members.length > 0) {
            var roles = _.map(members, 'role'),
                role = '';
            if (roles.indexOf('headmaster') > -1) {
                role = 'headmaster';
            } else if (roles.indexOf('teacher') > -1) {
                role = 'teacher';
            } else {
                role = 'student';
            }
            res.status(200).send(role);
        } else {
            res.sendStatus(204);
        }
    });
};
