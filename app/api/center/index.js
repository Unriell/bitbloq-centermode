'use strict';

var express = require('express'),
    controller = require('./center.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/me', auth.isAuthenticated(), controller.getMyCenter);
router.get('/teacher/me', auth.isAuthenticated(), controller.getMyCenters);

// POST
router.post('/', auth.isAuthenticated(), controller.createCenter);

module.exports = router;
