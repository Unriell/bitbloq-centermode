'use strict';

var express = require('express'),
    controller = require('./task.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/task/:id', auth.isAuthenticated(), controller.getTask);

// POST
router.post('/task', auth.isAuthenticated(), controller.createTask);

// PUT
router.put('/task/:id', auth.isAuthenticated(), controller.updateTask);

// DELETE
router.delete('/task/:id', auth.isAuthenticated(), controller.deleteTask);

module.exports = router;
