'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var azure = require('azure-storage');
var chalk = require('chalk');
var mime = require('mime');

var PLUGIN_NAME = 'gulp-upload-azure';

module.exports = function(options) {
    options = assign({}, options);
    options.verbose = process.argv.indexOf('--verbose') !== -1;

    if (options.account === undefined) {
        throw new gutil.PluginError(PLUGIN_NAME, '`account` required');
    }

    if (options.key === undefined) {
        throw new gutil.PluginError(PLUGIN_NAME, '`key` required');
    }

    if (options.container === undefined) {
        throw new gutil.PluginError(PLUGIN_NAME, '`container` required');
    }

    if (options.container.length === 0) {
        throw new gutil.PluginError(PLUGIN_NAME, '`container` is empty');
    }
    var fileCount = 0;
    var blobService = azure.createBlobService(options.account, options.key, options.host);

    var CONATAINERS = {};
    var createContainer = function(containerName, cb) {
        var self = CONATAINERS[containerName] = CONATAINERS[containerName] || {
            createQueue: [],
            isCreated: false,
            isCreating: false,
        };
        if (self.isCreated) {
            return cb();
        }
        self.createQueue.push(cb);
        if (self.isCreating) {
            return;
        }
        self.isCreating = true;
        blobService.createContainerIfNotExists(containerName, function(err) {
            self.createQueue.forEach(function(q) {
                q(err);
            });
            self.isCreated = true;
        });
    };

    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return;
        }

        var content = file.contents;
        if (file.contents.length === 0) {
            content = '';
        }

        var self = this;

        var blobName = file.relative;
        var container = options.container;
        if (container === '$root' && path.basename(blobName) !== blobName) {
            container = blobName.split(path.sep)[0];
            blobName = blobName.substr(container.length + path.sep.length);
        }

        if (options.verbose) {
            gutil.log(PLUGIN_NAME, ':', chalk.green(' start '), blobName, container);
        }
        createContainer(container, function(err) {
            if (err) {
                cb(new gutil.PluginError(PLUGIN_NAME, err, {
                    fileName: file.path
                }));
                return;
            }
            blobService.createBlockBlobFromText(container, blobName, content, {
                contentType: mime.lookup(file.relative),
                // contentEncoding: options.contentEncoding,
                cacheControl: options.cacheControl
            }, function(error) {
                if (error) {
                    cb(new gutil.PluginError(PLUGIN_NAME, error, {
                        fileName: file.path
                    }));
                    return;
                }
                fileCount++;
                cb(null, file);
            });
        });
    }, function(cb) {
        if (fileCount > 0) {
            gutil.log(PLUGIN_NAME, ':', gutil.colors.green(fileCount, fileCount === 1 ? 'file' : 'files', 'uploaded successfully'));
        } else {
            gutil.log(PLUGIN_NAME, ':', gutil.colors.yellow('No files uploaded'));
        }
        cb();
    });
};