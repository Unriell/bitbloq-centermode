'use strict';

var express = require('express'),
    controller = require('./center.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/:centerId/teacher/:teacherId', auth.isAuthenticated(), controller.getTeacher);
router.get('/me', auth.isAuthenticated(), controller.getMyCenter);
router.get('/:centerId/teacher', auth.isAuthenticated(), controller.getTeachers);
router.get('/:id', auth.isAuthenticated(), controller.getCenter);

// POST
router.post('/:centerId/teacher', auth.isAuthenticated(), controller.addTeacher);
router.post('/', auth.isAuthenticated(), controller.createCenter);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.updateCenter);

// DELETE
router.delete('/:centerId/teacher/:teacherId', auth.isAuthenticated(), controller.deleteTeacher);
router.delete('/:id', auth.isAuthenticated(), controller.anonCenter);

module.exports = router;
