'use strict';

var mongoose = require('mongoose');

var userRobotsSchema = new mongoose.Schema({
    userId: {
        type: String,
        trim: true,
        required: true
    },
    robot: {
        type: String,
        trim: true,
        required: true
    },
    activated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('robots-userRobots', userRobotsSchema);
