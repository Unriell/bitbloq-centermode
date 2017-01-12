'use strict';

var express = require('express'),
    controller = require('./task.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/group/:groupId', auth.isAuthenticated(), controller.getTasksByGroup);
router.get('/:id', auth.isAuthenticated(), controller.getTask);
router.get('/', auth.isAuthenticated(), controller.getMyTasks);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.updateTask);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.deleteTask);

module.exports = router;
