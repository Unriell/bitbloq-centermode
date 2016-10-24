'use strict';

var express = require('express'),
    controller = require('./center.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();


// GET
router.get('/center/:id', auth.isAuthenticated(), controller.getCenter);

// POST
router.post('/center', auth.isAuthenticated(), controller.createCenter);
router.post('/center/:centerId/teacher', auth.isAuthenticated(), controller.addTeacher);

// PUT
router.put('/center/:id', auth.isAuthenticated(), controller.updateCenter);

// DELETE
router.delete('/center/:id', auth.isAuthenticated(), controller.anonCenter);

module.exports = router;
