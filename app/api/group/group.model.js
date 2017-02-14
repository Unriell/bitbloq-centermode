'use strict';

var mongoose = require('mongoose'),
    UserFunctions = require('../user/user.functions.js');

var GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    status: {
        type: String,
        default: 'open' //open | inProgress | closed
    },
    accessId: {
        type: String,
        required: true
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
    center: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center',
        trim: false,
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

/**
 * Methods
 */

GroupSchema.methods = {

    /**
     * userCanUpdate - check if an user can update this object
     * @param {String} userId
     * @param {Function} next
     * @api public
     */
    userCanUpdate: function(userId, next) {
        if (String(userId) === String(this.creator) || String(userId) == String(this.teacher)) {
            next(null, true);
        } else {
            this.timesViewed++;
            UserFunctions.userIsHeadmaster(userId, this.center, function(err, centerId) {
                if (centerId) {
                    next(null, true);
                } else {
                    next(err, false);
                }
            });
        }
    }
};
module.exports = mongoose.model('CenterMode-Group', GroupSchema);
