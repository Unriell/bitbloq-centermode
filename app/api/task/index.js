'use strict';

var express = require('express'),
    controller = require('./task.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();


//HEAD
router.head('/:taskId/headmaster', auth.isAuthenticated(), controller.userIsHeadMasterByTask);

// GET
router.get('/group/:groupId/student/:studentId', auth.isAuthenticated(), controller.getTasksByStudent);
router.get('/group/:groupId', auth.isAuthenticated(), controller.getTasksByGroup);
router.get('/exercise/:exerciseId/count', auth.isAuthenticated(), controller.getTasksByExerciseCount);
router.get('/exercise/:exerciseId', auth.isAuthenticated(), controller.getTasksByExercise);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/', auth.isAuthenticated(), controller.getMyTasks);

//POST
router.post('/cloneToProject', auth.isAuthenticated(), controller.cloneToProject);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.update);
router.put('/:taskId/send', auth.isAuthenticated(), controller.sendTask);
router.put('/:taskId/mark', auth.isAuthenticated(), controller.mark);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.delete);

module.exports = router;
