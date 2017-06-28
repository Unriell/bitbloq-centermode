'use strict';

var mongoose = require('mongoose'),
    config = require('../../res/config.js'),
    jwt = require('jsonwebtoken');

var ConfirmationTokenSchema = new mongoose.Schema({
    _id: String,
    token: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

/**
 * Methods
 */
ConfirmationTokenSchema.methods = {
    generateToken: function(teacherId, centerId) {
        var token = jwt.sign({
            _id: this._id,
            teacherId: teacherId,
            centerId: centerId
        }, config.secrets.session, {});

        this._id = teacherId + ':' + centerId;
        this.token = token;

        return token;
    }
};


module.exports = mongoose.model('Token-Confirmation', ConfirmationTokenSchema);
