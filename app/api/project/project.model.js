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
    deleted: Boolean,
    _acl: {}
}, {
    timestamps: true
});

/**
 * Virtuals
 */

// Public profile information
ProjectSchema
    .virtual('profile')
    .get(function() {
        return {
            '_id': this._id,
            'name': this.name,
            'description': this.description,
            'creator': this.creator,
            'videoUrl': this.videoUrl,
            'timesViewed': this.timesViewed || 0,
            'timesAdded': this.timesAdded || 0,
            'codeProject': this.codeProject,
            'hardwareTags': this.hardwareTags,
            'userTags': this.userTags,
            'updatedAt': this.updatedAt,
            '_acl': this._acl
        };
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
 * Pre-save hook
 */
ProjectSchema
    .pre('save', function(next) {
        if (!thereIsAdmin(this)) {
            setUserAdmin(this, this.creator);
            next(this);
        } else {
            next();
        }
    });


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


/**
 * Private functions
 */

/**
 * thereIsAdmin - check if there is an admin
 * @param {Object} project
 * @api private
 * @return {Boolean}
 */
var thereIsAdmin = function(project) {
    var admin = false;
    if (project._acl) {
        for (var item in project._acl) {
            if (project._acl[item].permission === 'ADMIN') {
                admin = true;
            }
        }

    }
    return admin;
};

/**
 * setUserAdmin - set an user admin
 * @param {Object} project
 * @param {String} userId
 * @api private
 */
var setUserAdmin = function(project, userId) {
    project._acl = project._acl || {};
    project._acl['user:' + userId] = {
        permission: 'ADMIN'
    };
};


module.exports = mongoose.model('Project', ProjectSchema);
