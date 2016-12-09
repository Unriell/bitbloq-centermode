'use strict';

var express = require('express'),
    controller = require('./exercise.controller.js'),
    auth = require('../../components/auth/auth.service');

var router = express.Router();

// GET
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/:task', auth.isAuthenticated(), controller.getByTask);

// POST
router.post('/', auth.isAuthenticated(), controller.create);

// PUT
router.put('/:id', auth.isAuthenticated(), controller.update);

// DELETE
router.delete('/:id', auth.isAuthenticated(), controller.delete);


module.exports = router;
