'use strict';

var mongoose = require('mongoose');

var ExerciseSchema = new mongoose.Schema({

    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
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
    defaultTheme: {
        type: String,
        default: 'infotab_option_colorTheme'
    },
    hardware: {
        board: String,
        components: [],
        connections: [],
        robot: String
    },
    software: {
        vars: {},
        setup: {},
        loop: {}
    },
    hardwareTags: [String],
    selectedBloqs: {}
}, {
    timestamps: true
});

module.exports = mongoose.model('CenterMode-Exercise', ExerciseSchema);
