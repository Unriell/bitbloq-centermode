'use strict';

var express = require('express'),
    controller = require('./group.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//HEAD
router.head('/:id/register', auth.isAuthenticated(), controller.registerInGroup);

// GET
router.get('/:id', auth.isAuthenticated(), controller.getGroup);
router.get('/teacher/:teacherId', auth.isAuthenticated(), controller.getGroupByHeadMaster);
router.get('/center/:centerId', auth.isAuthenticated(), controller.getGroups);
router.get('/exercise/:exerciseId', auth.isAuthenticated(), controller.getGroupsByExercise);
router.get('/', auth.isAuthenticated(), controller.getAllGroups);

// POST
router.post('/', auth.isAuthenticated(), controller.createGroup);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.updateGroup);

// DELETE
router.delete('/:groupId/student/:studentId', auth.isAuthenticated(), controller.deleteStudent);
router.delete('/:id', auth.isAuthenticated(), controller.deleteGroup);

module.exports = router;
