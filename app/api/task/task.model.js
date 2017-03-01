'use strict';

var mongoose = require('mongoose');


var TaskSchema = new mongoose.Schema({
    exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterMode-Exercise',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mark: Number,
    remark: String,
    status: {
        type: String,
        default: 'pending' //pending | delivered | corrected
    },
    result: {},
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        trim: false,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        trim: false,
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterMode-Group',
        trim: false,
        required: true
    },
    initDate: {
        type: Date,
        default: Date.now()
    },
    endDate: Date
}, {
    timestamps: true
});


module.exports = mongoose.model('CenterMode-Task', TaskSchema);
