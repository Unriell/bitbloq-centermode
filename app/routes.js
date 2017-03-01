/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors/index');
var express = require('express');
var router = express.Router();

module.exports = function(app) {

    // Insert routes below
    router.use('/assignment', require('./api/assignment/index'));
    router.use('/center', require('./api/center/index'));
    router.use('/exercise', require('./api/exercise/index'));
    router.use('/task', require('./api/task/index'));
    router.use('/group', require('./api/group/index'));
    router.use('/makeblock', require('./api/makeblock/index'));
    router.use('/version', require('./api/version/index'));
    router.use('/user', require('./api/user/index'));

    // Set a prefix for all calls
    app.use('/centerMode/v1', router);

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*').get(errors[404]);
};
