'use strict';

var express = require('express'),
    controller = require('./center.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/:centerId/teacher/:teacherId', auth.isAuthenticated(), controller.getTeacher);
router.get('/me', auth.isAuthenticated(), controller.getMyCenter);
router.get('/teacher/me', auth.isAuthenticated(), controller.getMyCenters);
router.get('/:centerId/teacher', auth.isAuthenticated(), controller.getTeachers);

// POST
router.post('/:centerId/teacher', auth.isAuthenticated(), controller.addTeacher);
router.post('/', auth.isAuthenticated(), controller.createCenter);

// DELETE
router.delete('/:centerId/teacher/:teacherId', auth.isAuthenticated(), controller.deleteTeacher);

module.exports = router;
