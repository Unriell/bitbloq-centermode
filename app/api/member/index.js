'use strict';

var express = require('express'),
    controller = require('./member.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//HEAD
router.head('/headmaster', auth.isAuthenticated(), controller.isHeadmaster);

// GET
router.get('/role', auth.isAuthenticated(), controller.getMyRole);


module.exports = router;
