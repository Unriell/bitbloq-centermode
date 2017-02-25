'use strict';

var express = require('express'),
    controller = require('./makeblock.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// POST
// RECORDAR CAMBIAR: router.post('/generateCodes', auth.hasRole('admin'), controller.generateCodes);
router.post('/generateCodes', controller.generateCodes);

module.exports = router;
