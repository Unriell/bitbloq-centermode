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
router.post('/confirm-teacher', auth.isAuthenticated(), controller.confirmTeacher);
router.post('/student', auth.isAuthenticated(), controller.registerInGroup);
router.post('/activate', auth.isAuthenticated(), controller.activateStudentMode);

//PUT
router.put('/send-invitation', auth.isAuthenticated(), controller.sendInvitation);

// DELETE
router.delete('/teacher/:teacherId/center/:centerId', auth.isAuthenticated(), controller.deleteTeacher);
router.delete('/student/:studentId/group/:groupId', auth.isAuthenticated(), controller.deleteStudent);
router.delete('/invitation/teacher/:teacherId/center/:centerId', auth.isAuthenticated(), controller.deleteInvitation);


module.exports = router;
