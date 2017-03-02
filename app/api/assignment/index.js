'use strict';

var express = require('express'),
    controller = require('./assignment.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//GET
router.get('/exercise/:exerciseId', auth.isAuthenticated(), controller.getByExercise);

// PUT
router.put('/', auth.isAuthenticated(), controller.assign);


module.exports = router;
