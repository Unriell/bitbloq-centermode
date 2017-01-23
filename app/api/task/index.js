'use strict';

var express = require('express'),
    controller = require('./task.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/group/:groupId', auth.isAuthenticated(), controller.getTasksByGroup);
router.get('/exercise/:exerciseId', auth.isAuthenticated(), controller.getTasksByExercise);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/', auth.isAuthenticated(), controller.getMyTasks);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.update);
router.put('/:taskId/send', auth.isAuthenticated(), controller.sendTask);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.delete);

module.exports = router;
