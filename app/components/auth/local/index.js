'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service.js');

var router = express.Router();

router.post('/', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            err.code = (err.code && err.code.match(/[1-5][0-5][0-9]/g)) ? parseInt(err.code) : 500;
            return res.status(err.code).json({
                message: 'Something went wrong, please try again.'
            });
        }

        if (info) {
            if (info.user === 'undefined') {
                return res.status(404).json({
                    message: 'This email is not registered, please sign up. '
                });
            } else {
                return res.status(401).json({
                    message: 'Password incorrect, please try again.'
                });
            }
        }

        var token = auth.signToken(user._id, user.role);
        res.json({
            token: token
        });
    })(req, res, next);
});

module.exports = router;
