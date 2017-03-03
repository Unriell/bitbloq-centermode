'use strict';

var mongoose = require('mongoose');

var ProjectSchema = new mongoose.Schema({
    corbelId: String,
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: String,
    description: String,
    videoUrl: String,
    code: String,
    codeProject: Boolean,
    timesViewed: {
        type: Number,
        default: 0
    },
    timesAdded: {
        type: Number,
        default: 0
    },
    timesDownload: {
        type: Number,
        default: 0
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
    userTags: [String],
    image: {
        type: String,
        default: 'default'
    },
    useBitbloqConnect: {
        type: Boolean,
        default: false
    },

    bitbloqConnectBT: {},
    genericBoardSelected: {},
    _acl: {},
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

ProjectSchema.pre('find', findNotDeletedMiddleware);
ProjectSchema.pre('findOne', findNotDeletedMiddleware);
ProjectSchema.pre('findOneAndUpdate', findNotDeletedMiddleware);
ProjectSchema.pre('count', findNotDeletedMiddleware);


/**
 * Methods
 */

ProjectSchema.methods = {

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


module.exports = mongoose.model('Project', ProjectSchema);
