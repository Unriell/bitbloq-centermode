'use strict';

var express = require('express'),
    controller = require('./assignment.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// PUT
router.put('/', auth.isAuthenticated(), controller.assign);


module.exports = router;
