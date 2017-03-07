'use strict';

var mongoose = require('mongoose');

var thirdPartyRobotsSchema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    robot: {
        type: String,
        trim: true,
        required: true
    },
    used: {
        user: {
            type: String,
            trim: true
        },
        date: Date
    },
    reason: {
        type: String
    }
}, {
    timestamps: true
});

thirdPartyRobotsSchema.pre('save', function(next) {
    var self = this;
    this.constructor.find({
        code: self.code
    }, function(err, codes) {
        if (!codes.length) {
            next();
        } else {
            self.save(next);
        }
    });
});

module.exports = mongoose.model('CenterMode-thirdPartyRobots', thirdPartyRobotsSchema);
