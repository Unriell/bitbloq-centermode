'use strict';

var express = require('express'),
    controller = require('./exercise.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

//HEAD
router.head('/:exerciseId/owner', auth.isAuthenticated(), controller.userIsOwner);

// GET
router.get('/teacher/:teacherId', auth.isAuthenticated(), controller.getByTeacher);
router.get('/teacher/:teacherId/count', auth.isAuthenticated(), controller.getCountByTeacher);
router.get('/count', auth.isAuthenticated(), controller.getAllCount);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/', auth.isAuthenticated(), controller.getAll);


// POST
router.post('/', auth.isAuthenticated(), controller.create);

// PUT
router.put('/:exerciseId/assign', auth.isAuthenticated(), controller.assignGroups);
router.put('/:id/clone', auth.isAuthenticated(), controller.clone);
router.put('/:id', auth.isAuthenticated(), controller.update);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.delete);


module.exports = router;
