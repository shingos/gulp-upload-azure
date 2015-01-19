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

    var fileCount = 0;
    var blobService = azure.createBlobService(options.account, options.key, options.host);

    var createQueue = [];
    var isCreated = false;
    var isCreating = false;
    var createContainer = function(cb) {
        if (isCreated) {
            return cb();
        }
        createQueue.push(cb);
        if (isCreating) {
            return;
        }
        isCreating = true;
        blobService.createContainerIfNotExists(options.container, function (err) {
            createQueue.forEach(function (q) {
                q(err);
            });
            isCreated = true;
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

        var self = this;

        var blobName = file.relative;
        createContainer(function (err) {
            if (err) {
                cb(new gutil.PluginError(PLUGIN_NAME, err, {
                    fileName: file.path
                }));
                return;
            }
            blobService.createBlockBlobFromText(options.container, blobName, file.contents, {
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

        if (options.verbose) {
            gutil.log(PLUGIN_NAME + ' :', chalk.green('✔ ') + file.relative);
        }
    }, function(cb) {
        if (fileCount > 0) {
            gutil.log(PLUGIN_NAME + ' :', gutil.colors.green(fileCount, fileCount === 1 ? 'file' : 'files', 'uploaded successfully'));
        } else {
            gutil.log(PLUGIN_NAME + ' :', gutil.colors.yellow('No files uploaded'));
        }
        cb();
    });
};