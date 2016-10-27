'use strict';

var express = require('express'),
    controller = require('./user.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//HEAD
router.head('/headMaster', auth.isAuthenticated(), controller.isHeadMaster);

// GET
router.get('/role', auth.isAuthenticated(), controller.getMyRole);

module.exports = router;
