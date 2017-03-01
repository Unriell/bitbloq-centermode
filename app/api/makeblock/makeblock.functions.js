'use strict';
var uuid = require('node-uuid');

exports.generateCode = function() {
    return uuid.v1();
}
