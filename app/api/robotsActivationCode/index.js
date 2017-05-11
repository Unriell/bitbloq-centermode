'use strict';

var express = require('express'),
    controller = require('./robotsActivationCode.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//GET
// RECORDAR CAMBIAR:
router.get('/:robot/unused', auth.hasRole('admin'), controller.getUnusedCodesByRobot);
// RECORDAR CAMBIAR:
router.get('/:robot/used', auth.hasRole('admin'), controller.getUsedCodesByRobot);
// RECORDAR CAMBIAR:
router.get('/:robot/', auth.hasRole('admin'), controller.getCodesByRobot);

router.post('/generateCodes', auth.hasRole('admin'), controller.generateCodes);
router.post('/activate', auth.isAuthenticated(), controller.activateRobot);

module.exports = router;
