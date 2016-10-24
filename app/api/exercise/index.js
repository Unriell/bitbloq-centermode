'use strict';

var express = require('express'),
    controller = require('./center.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/exercise/:id', auth.isAuthenticated(), controller.getExercise);
router.get('/exercise/:task', auth.isAuthenticated(), controller.getExerciseByTask);

// POST
router.post('/exercise', auth.isAuthenticated(), controller.createExercise);

// PUT
router.put('/exercise/:id', auth.isAuthenticated(), controller.updateExercise);

// DELETE
router.delete('/exercise/:id', auth.isAuthenticated(), controller.deleteExercise);


module.exports = router;
