'use strict';

var express = require('express'),
    controller = require('./userrobots.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

router.get('/:userId', auth.isAuthenticated(), controller.getUserRobots);

module.exports = router;
