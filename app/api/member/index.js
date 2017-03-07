'use strict';

var express = require('express'),
    controller = require('./member.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//HEAD
router.head('/headmaster', auth.isAuthenticated(), controller.isHeadmaster);

// GET
router.get('/role', auth.isAuthenticated(), controller.getMyRole);
router.get('/teacher/:teacherId/center/:centerId', auth.isAuthenticated(), controller.getTeacher);
router.get('/teachers/center/:centerId', auth.isAuthenticated(), controller.getTeachers);

// POST
router.post('/teacher', auth.isAuthenticated(), controller.addTeacher);

// DELETE
router.delete('/teacher/:teacherId/center/:centerId', auth.isAuthenticated(), controller.deleteTeacher);


module.exports = router;
