'use strict';

var mongoose = require('mongoose');

var CenterSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    location: {
        type: String
    },
    telephone: {
        type: Number,
        trim: true,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        trim: false,
        required: true
    },
    activatedRobots: [],
    notConfirmedTeacher: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        trim: false
    }],
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

CenterSchema.pre('find', findNotDeletedMiddleware);
CenterSchema.pre('findOne', findNotDeletedMiddleware);
CenterSchema.pre('findOneAndUpdate', findNotDeletedMiddleware);
CenterSchema.pre('count', findNotDeletedMiddleware);

/**
 * Methods
 */

CenterSchema.methods = {

    /**
     * isOwner - check if an user is owner of exercise
     *
     * @param {String} userId
     * @return {Boolean}
     * @api public
     */
    isOwner: function(userId) {
        var owner = false;
        if (String(this.creator) === String(userId)) {
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
        this.deleted = true;
        this.save(next);
    }
};

module.exports = mongoose.model('CenterMode-Center', CenterSchema);
