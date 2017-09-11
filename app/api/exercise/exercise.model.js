'use strict';

var mongoose = require('mongoose'),
    AssignmentFunctions = require('../assignment/assignment.functions.js');

var ExerciseSchema = new mongoose.Schema({

    name: {
        type: String,
        trim: true
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
        robot: String,
        showRobotImage: String
    },
    code: String,
    software: {
        vars: {},
        setup: {},
        loop: {}
    },
    hardwareTags: [String],
    selectedBloqs: {},
    useBitbloqConnect: {
        type: Boolean,
        default: false
    },
    bitbloqConnectBT: {},
    deleted: Boolean
}, {
    timestamps: true
});

/**
 * Pre hook
 */

function findNotDeletedMiddleware(next) {
    this.where('deleted').in([false, undefined, null]);
    next();
}

ExerciseSchema.pre('find', findNotDeletedMiddleware);
ExerciseSchema.pre('findOne', findNotDeletedMiddleware);
ExerciseSchema.pre('findOneAndUpdate', findNotDeletedMiddleware);
ExerciseSchema.pre('count', findNotDeletedMiddleware);

/**
 * Methods
 */

ExerciseSchema.methods = {

    /**
     * isOwner - check if an user is owner of exercise
     *
     * @param {String} userId
     * @return {Boolean}
     * @api public
     */
    isOwner: function(userId) {
        var owner = false;
        if (String(this.teacher) === String(userId) || String(this.creator) === String(userId)) {
            owner = true;
        }
        return owner;
    },

    /**
     * delete - change deleted attribute to true
     *
     * @param {Function} next
     * @api public
     */
    delete: function(next) {
        var exerciseId = this._id;
        this.deleted = true;
        this.save(function(err) {
            if (!err) {
                AssignmentFunctions.removeByExercise(exerciseId, next);
            } else {
                next(err);
            }
        });
    }

};

module.exports = mongoose.model('CenterMode-Exercise', ExerciseSchema);
