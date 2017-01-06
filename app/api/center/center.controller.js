'use strict';

var Center = require('./center.model.js'),
    UserFunctions = require('../user/user.functions.js'),
    GroupFunctions = require('../group/group.functions.js'),
    centerFunctions = require('./center.functions.js'),
    async = require('async');

/**
 * Create center
 * @param req
 * @param res
 */
exports.addTeacher = function(req, res) {
    var userId = req.user._id,
        newTeacherEmails = req.body,
        centerId = req.params.centerId;
    async.parallel([
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        UserFunctions.getAllUsersByEmails.bind(UserFunctions, newTeacherEmails)
    ], function(err, result) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!result) {
            res.sendStatus(304);
        } else {
            UserFunctions.addAllTeachers(result[1], result[0], function(err, teachers) {
                if (err) {
                    console.log(err);
                    err.code = parseInt(err.code) || 500;
                    res.status(err.code).send(err);
                } else {
                    res.status(200).send(teachers);
                }
            });
        }
    });
};

/**
 * Create center
 * @param req
 * @param res
 */
exports.createCenter = function(req, res) {
    var userId = req.user._id,
        center = req.body;
    if (center && center.name && center.location && center.telephone) {
        center.creator = userId;
        var newCenter = new Center(center);
        async.waterfall([
            function(next) {
                newCenter.save(center, next);
            },
            function(savedCenter, updated, next) {
                UserFunctions.addHeadMaster(userId, savedCenter._id, next);
            }
        ], function(err, result) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (result) {
                res.sendStatus(200);
            } else {
                res.sendStatus(204);
            }
        });
    } else {
        var centerError = '';
        if (!center) {
            centerError = 'No center data provided';
        } else {
            if (!center.name) {
                centerError = 'No center name provided';
            } else if (!center.location) {
                centerError = 'No center location provided';
            } else if (!center.telephone) {
                centerError = 'No center telephone provided';
            }
        }
        res.status(400).send(centerError);
    }

};

/**
 * Delete a teacher in a center
 * @param req
 * @param res
 */
exports.deleteTeacher = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId,
        teacherId = req.params.teacherId;
    if (userId.toString() !== teacherId.toString()) {
        async.waterfall([
            UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
            function(centerId, next) {
                GroupFunctions.deleteGroups(teacherId, centerId, next);
            },
            function(updated, next) {
                UserFunctions.deleteTeacher(teacherId, centerId, next);
            }
        ], function(err, result) {
            if (err) {
                console.log(err);
                err.code = parseInt(err.code) || 500;
                res.status(err.code).send(err);
            } else if (!result) {
                res.sendStatus(304);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        res.sendStatus(409);

    }

};

/**
 * Get my center, if user is head master
 * @param req
 * @param res
 */
exports.getMyCenter = function(req, res) {
    var userId = req.user._id;
    UserFunctions.getCenterIdbyHeadMaster(userId, function(err, centerId) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else {
            if (centerId) {
                Center.findById(centerId, function(err, center) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else if (center) {
                        res.send(center);
                    } else {
                        res.sendStatus(204);
                    }
                });
            } else {
                async.waterfall([
                    UserFunctions.getCenterIdbyTeacher.bind(UserFunctions, userId),
                    function(centerId, next) {
                        Center.findById(centerId, next);
                    }
                ], function(err, center) {
                    if (err) {
                        console.log(err);
                        err.code = parseInt(err.code) || 500;
                        res.status(err.code).send(err);
                    } else if (center) {
                        res.send(center);
                    } else {
                        res.sendStatus(204);
                    }
                });
            }
        }
    })
};

/**
 * Get a teacher
 * @param req
 * @param res
 */
exports.getTeacher = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId,
        teacherId = req.params.teacherId;
    async.waterfall([
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        function(centerId, next) {
            UserFunctions.getTeacher(teacherId, centerId, next);
        }
    ], function(err, teacher) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!teacher) {
            res.sendStatus(404);
        } else {
            res.send(teacher);
        }
    });
};

/**
 * Get teachers in a center
 * @param req
 * @param res
 */
exports.getTeachers = function(req, res) {
    var userId = req.user._id,
        centerId = req.params.centerId;
    async.waterfall([
        UserFunctions.userIsHeadMaster.bind(UserFunctions, userId, centerId),
        function(centerId, next) {
            UserFunctions.getAllTeachers(centerId, function(err, teachers) {
                next(err, teachers, centerId);
            });
        },
        function(teachers, centerId, next) {
            async.map(teachers, function(teacher, next) {
                centerFunctions.getStats(teacher, centerId, next);
            }, function(err, completedTeachers) {
                next(err, completedTeachers);
            })
        }
    ], function(err, teachers) {
        if (err) {
            console.log(err);
            err.code = parseInt(err.code) || 500;
            res.status(err.code).send(err);
        } else if (!teachers) {
            res.sendStatus(304);
        } else {
            res.send(teachers);
        }
    });
};

/**
 * Get center
 * @param req
 * @param res
 */
exports.getCenter = function(req, res) {

};

/**
 * Update center information
 * @param req
 * @param res
 */
exports.updateCenter = function(req, res) {

};

/**
 * Make anonymous a center if user is owner
 * @param req
 * @param res
 */
exports.anonCenter = function(req, res) {

};
