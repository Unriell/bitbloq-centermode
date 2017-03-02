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

TaskSchema.pre('find', findNotDeletedMiddleware);
TaskSchema.pre('findOne', findNotDeletedMiddleware);
TaskSchema.pre('findOneAndUpdate', findNotDeletedMiddleware);
TaskSchema.pre('count', findNotDeletedMiddleware);


/**
 * Methods
 */

TaskSchema.methods = {

    /**
     * delete - change deleted attribute to true
     *
     * @param {Function} next
     * @api public
     */
    delete: function(next) {
        this.deleted = true;
        this.save(next);
    }
};


module.exports = mongoose.model('CenterMode-Task', TaskSchema);
