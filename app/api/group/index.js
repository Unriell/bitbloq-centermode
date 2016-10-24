'use strict';

var express = require('express'),
    controller = require('./group.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/group/:id', auth.isAuthenticated(), controller.getGroup);
router.get('/group/teacher/:id', auth.isAuthenticated(), controller.getGroupByTeacher);

// POST
router.post('/group', auth.isAuthenticated(), controller.createGroup);

// PUT
router.put('/group/:id', auth.isAuthenticated(), controller.updateGroup);

// DELETE
router.delete('/group/:id', auth.isAuthenticated(), controller.deleteGroup);

module.exports = router;
