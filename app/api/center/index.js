'use strict';

var express = require('express'),
    controller = require('./center.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();


//HEAD
router.head('/:type', auth.isAuthenticated(), controller.isHeadMaster);

// GET
router.get('/:id', auth.isAuthenticated(), controller.getCenter);
router.get('/:centerId/teacher', auth.isAuthenticated(), controller.getTeachers);

// POST
router.post('/', auth.isAuthenticated(), controller.createCenter);
router.post('/:centerId/teacher', auth.isAuthenticated(), controller.addTeacher);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.updateCenter);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.anonCenter);
router.delete('/:centerId/teacher/:teacherId', auth.isAuthenticated(), controller.deleteTeacher);

module.exports = router;
