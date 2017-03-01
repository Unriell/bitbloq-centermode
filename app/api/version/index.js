'use strict';

var express = require('express'),
    controller = require('./version.controller.js'),
    auth = require('../../components/auth/auth.service'),
    router = express.Router();

router.get('/', controller.getAll);
router.post('/all', auth.hasRole('admin'), controller.createAll);
router.delete('/all', auth.hasRole('admin'), controller.deleteAll);

module.exports = router;
