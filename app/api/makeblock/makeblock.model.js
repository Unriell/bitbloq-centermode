'use strict';

var mongoose = require('mongoose'),
    CodeFunctions = require('./makeblock.functions.js');

var makeblockSchema = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});

makeblockSchema.pre('save', function(next) {
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

module.exports = mongoose.model('CenterMode-Makeblock', makeblockSchema);
