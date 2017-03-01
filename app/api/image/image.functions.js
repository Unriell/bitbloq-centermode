'use strict';

var gcloud = require('gcloud'),
    config = require('../../res/config/config'),
    storage = gcloud.storage(config.gcloud),
    bucket = storage.bucket(config.cloudStorageBucket);

exports.delete = function(folder, imageId, next) {
    bucket.deleteFiles({
        prefix: 'images/' + folder + '/' + imageId
    }, function(err) {
        if (err) {
            console.log('Error: delete image');
            console.log(err);
        }
        if (next) {
            next();
        }
    });
};
