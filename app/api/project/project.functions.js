'use strict';

var Project = require('./project.model.js');

exports.deleteAllByUser = function(userId, next) {
    Project.find({
        creator: userId
    }, function(projects) {
        if (projects.length > 0) {
            projects.forEach(function(project) {
                project.delete(next);
            });
        } else {
            next({
                code: 404,
                message: 'Exercise not found'
            });
        }
    });
};

exports.create = function(project, next) {
    var userAcl = 'user:' + project.creator;
    project._acl = {};
    project._acl[userAcl] = {
        'permission': 'ADMIN'
    };
    var projectToSave = new Project(project);
    projectToSave.save(next);
};
