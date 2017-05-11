'use strict';
var uuid = require('node-uuid');

exports.generateCode = function() {
    return exports.formatCode(uuid.v4().replace(/-/g, ''));
};

exports.formatCode = function(code) {
    var codeFormatted = code.replace(/(.{8})/g, '$1-');
    return codeFormatted.slice(0, -1);
};
