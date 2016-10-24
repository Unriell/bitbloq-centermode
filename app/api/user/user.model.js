/* global Buffer */
'use strict';

var mongoose = require('mongoose'),
    ProjectFunctions = require('../project/project.functions.js');

var UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    bannedInForum: {
        type: Boolean,
        default: false
    },
    social: {
        google: {
            id: {
                type: String,
                default: ''
            }
        },
        facebook: {
            id: {
                type: String,
                default: ''
            }
        }
    },
    role: {
        type: String, // user | admin
        default: 'user'
    },
    birthday: {
        type: Date
    },
    newsletter: {
        type: Boolean,
        default: false
    },
    chromeapp: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: 'es-ES'
    },
    cookiePolicyAccepted: Boolean,
    takeTour: {
        type: Boolean,
        default: false
    },
    hasBeenAskedIfTeacher: {
        type: Boolean,
        default: false
    },
    hasFirstComponent: {
        type: Boolean,
        default: false
    },
    hasBeenWarnedAboutChangeBloqsToCode: {
        type: Boolean,
        default: false
    },
    isTeacher: Boolean,
    password: String,
    salt: String,
    corbelHash: {
        type: Boolean
    },
    needValidation: {
        type: Boolean
    },
    tutor: {
        dni: String,
        firstName: String,
        lastName: String,
        email: String,
        validation: {
            date: Date,
            result: Boolean
        }
    },
    anonymous: String,
    centers: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Center',
            trim: false
        },
        role: String // headMaster | teacher | student
    }]
}, {
    timestamps: true
});

/**
 * Virtuals
 */

// Public profile information
UserSchema
    .virtual('profile')
    .get(function() {
        return {
            'username': this.username,
            'role': this.role
        };
    });

// Information for the owner
UserSchema
    .virtual('owner')
    .get(function() {
        return {
            '_id': this._id,
            'firstName': this.firstName,
            'lastName': this.lastName,
            'username': this.username,
            'email': this.email,
            'role': this.role,
            'social': {
                'google': {
                    id: this.social.google.id
                },
                'facebook': {
                    id: this.social.facebook.id
                }
            },
            'googleEmail': this.googleEmail,
            'facebookEmail': this.facebookEmail,
            'bannedInForum': this.bannedInForum,
            'newsletter': this.newsletter,
            'chromeapp': this.chromeapp,
            'isTeacher': this.isTeacher,
            'language': this.language,
            'cookiePolicyAccepted': this.cookiePolicyAccepted,
            'hasBeenAskedIfTeacher': this.hasBeenAskedIfTeacher,
            'hasBeenWarnedAboutChangeBloqsToCode': this.hasBeenWarnedAboutChangeBloqsToCode,
            'hasFirstComponent': this.hasFirstComponent,
            'takeTour': this.takeTour,
            'hasBeenValidated': this.hasBeenValidated,
            'centers': this.centers
        };
    });

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function() {
        return {
            '_id': this._id,
            'role': this.role
        };
    });

// Public tutor information
UserSchema
    .virtual('tutorProfile')
    .get(function() {
        return {
            'hasBeenValidated': this.hasBeenValidated,
            'tutor': this.tutor
        };
    });


/**
 * Validations
 */

// Validate empty email
UserSchema
    .path('email')
    .validate(function(email) {
        //TODO esto podría ir en atributo en Schema o meterlo abajo....

        return email.length;
    }, 'Email cannot be blank');

// Validate empty password
UserSchema
    .path('password')
    .validate(function(password) {
        //TODO esto podría ir en atributo en Schema....

        return password.length;
    }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
    .path('email')
    .validate(function(value, respond) {
        var self = this;
        var query = this.constructor.where({
            $or: [{
                email: value
            }, {
                google: {
                    email: value
                },
                facebook: {
                    email: value
                }
            }]
        });
        return this.constructor.findOne(query).then(function(user) {
            if (user) {
                if (self.id === user.id) {
                    return respond(true);
                }
                return respond(false);
            }
            return respond(true);
        }).catch(function(err) {
            throw err;
        });
    }, 'The specified email address is already in use.');

// Validate username is not taken
UserSchema
    .path('username')
    .validate(function(value, respond) {
        var self = this;

        this.constructor.findOne({
            username: value
        }, function(err, user) {
            if (user) {
                if (self.id === user.id) {
                    return respond(true);
                }
                return respond(false);
            }
            return respond(true);
        })

    }, 'The specified username is already in use.');

var validatePresenceOf = function(value) {
    return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function(next) {
        // Handle new/update passwords
        if (this.isModified('password')) {
            if (!validatePresenceOf(this.password)) {
                next(new Error('Invalid password'));
            }

            // Make salt with a callback
            var _this = this;
            this.makeSalt(function(saltErr, salt) {
                if (saltErr) {
                    next(saltErr);
                } else {
                    _this.salt = salt;
                    _this.encryptPassword(_this.password, function(encryptErr, hashedPassword) {
                        if (encryptErr) {
                            next(encryptErr);
                        }
                        _this.password = hashedPassword;
                        next();
                    });
                }

            });
        } else {
            next();
        }
    });

UserSchema
    .pre('validate', function(next) {
        // Handle birthday
        if (this.isValidated()) {
            next();
        } else {
            next(404);
        }
    });

UserSchema
    .pre('validate', function(next) {
        // Handle new/update role
        if (this.role !== 'user' && this.isModified('role')) {
            this.invalidate('role');
            next(401);
        } else {
            next();
        }
    });

UserSchema
    .pre('validate', function(next) {
        // Handle new/update passwords
        if (this.isModified('bannedInForum')) {
            this.invalidate('bannedInForum');
            next(401);
        } else {
            next();
        }
    });


UserSchema
    .pre('validate', function(next) {
        // Handle new/update passwords
        if (this.needValidation) {
            this.bannedInForum = true;
        }
        next();
    });

/**
 * Methods
 */
UserSchema.methods = {

    /**
     * check if user is validated
     *
     * @param {Object} user
     * @return {Boolean}
     * @api public
     */
    isValidated: function() {
        if (this.anonymous) {
            return false;
        } else {
            if (this.needValidation) {
                var createdDay = new Date(this.createdAt);
                createdDay.setDate(createdDay.getDate() + 15);
                if (createdDay.getTime() < Date.now()) {
                    this.anonymize('rejectInValidation', function() {
                        return false
                    });
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }
    },

    anonymize: function(anonText, next) {
        this.firstName = 'anon';
        this.lastName = 'anon';
        this.email = 'anon@anon.com' + Date.now();
        this.username = 'anon' + Date.now();
        this.password = Date.now() * Math.random();
        this.bannedInForum = true;
        this.needValidation = false;
        this.tutor = {
            dni: '',
            firstName: '',
            lastName: '',
            email: '',
            validation: {
                result: false,
                date: Date.now()
            }
        };
        this.social = {
            google: {
                id: ''
            },
            facebook: {
                id: ''
            }
        };
        this.anonymous = anonText;

        var that = this;
        ProjectFunctions.deleteAllByUser(this._id, function(err) {
            if (err) {
                next(500);
            } else {
                that.save(next);
            }
        });
    }
};

module.exports = mongoose.model('User', UserSchema);

