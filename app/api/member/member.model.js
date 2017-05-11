'use strict';

var mongoose = require('mongoose');


var MemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        trim: false,
        required: true
    },
    center: { //if user is teacher
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterMode-Center'
    },
    group: { //if user is student
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterMode-Group'
    },
    role: {
        type: String, // headmaster | teacher | student
        required: true
    },
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

MemberSchema.pre('find', findNotDeletedMiddleware);
MemberSchema.pre('findOne', findNotDeletedMiddleware);
MemberSchema.pre('findOneAndUpdate', findNotDeletedMiddleware);
MemberSchema.pre('count', findNotDeletedMiddleware);


/**
 * Methods
 */

MemberSchema.methods = {

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

module.exports = mongoose.model('CenterMode-Member', MemberSchema);
