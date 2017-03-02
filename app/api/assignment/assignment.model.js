'use strict';

var mongoose = require('mongoose');


var AssignmentSchema = new mongoose.Schema({
    exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterMode-Exercise',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterMode-Group',
        trim: false,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        trim: false,
        required: true
    },
    initDate: Date,
    endDate: Date
}, {
    timestamps: true
});


module.exports = mongoose.model('CenterMode-Assignment', AssignmentSchema);
