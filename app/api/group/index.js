'use strict';

var express = require('express'),
    controller = require('./group.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/:id/students', auth.isAuthenticated(), controller.getGroupStudents);
router.get('/:id/exercises', auth.isAuthenticated(), controller.getGroupExercises);
router.get('/:id', auth.isAuthenticated(), controller.getGroup);
router.get('/teacher/:teacherId', auth.isAuthenticated(), controller.getGroupByHeadmaster);
router.get('/center/:centerId', auth.isAuthenticated(), controller.getGroups);
router.get('exercise/:exerciseId', auth.isAuthenticated(), controller.getGroupsByExercise);
router.get('/', auth.isAuthenticated(), controller.getAllGroups);

// POST
router.post('/', auth.isAuthenticated(), controller.createGroup);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.updateGroup);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.deleteGroup);

module.exports = router;
