'use strict';

var express = require('express'),
    controller = require('./makeblock.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//GET
router.get('/:robot/unused', controller.getUnusedCodesByRobot);
router.get('/:robot/used', controller.getUsedCodesByRobot);
router.get('/:robot/', controller.getCodesByRobot);

// POST
// RECORDAR CAMBIAR: router.post('/generateCodes', auth.hasRole('admin'), controller.generateCodes);
router.post('/generateCodes', controller.generateCodes);

module.exports = router;
