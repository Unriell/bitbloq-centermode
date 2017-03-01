'use strict';

var express = require('express'),
    controller = require('./makeblock.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//GET
// RECORDAR CAMBIAR:
router.get('/:robot/unused', controller.getUnusedCodesByRobot);
// RECORDAR CAMBIAR:
router.get('/:robot/used', controller.getUsedCodesByRobot);
// RECORDAR CAMBIAR:
router.get('/:robot/', controller.getCodesByRobot);

// POST
// RECORDAR CAMBIAR: router.post('/generateCodes', auth.hasRole('admin'), controller.generateCodes);
router.post('/generateCodes', controller.generateCodes);
router.post('/activate', controller.activateRobot)

module.exports = router;
