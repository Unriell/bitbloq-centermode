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
    endDate: Date,
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

AssignmentSchema.pre('find', findNotDeletedMiddleware);
AssignmentSchema.pre('findOne', findNotDeletedMiddleware);
AssignmentSchema.pre('findOneAndUpdate', findNotDeletedMiddleware);
AssignmentSchema.pre('count', findNotDeletedMiddleware);


/**
 * Methods
 */

AssignmentSchema.methods = {

    /**
     * delete - change deleted attribute to true
     *
     * @param {String} next
     * @api public
     */
    delete: function(next) {
        this.deleted = true;
        this.save(next);
    }

};

module.exports = mongoose.model('CenterMode-Assignment', AssignmentSchema);
