'use strict';
var dotenv = require('dotenv');
dotenv.load();
var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var uploadAzure = require('./');

var account = process.env.ACCOUNT;
var key = process.env.KEY;
var host = process.env.HOST;

it('should upload files to Azure', function (cb) {
    this.timeout(20000);
    var stream = uploadAzure({
        account: process.env.ACCOUNT,
        key: process.env.KEY,
        host: process.env.HOST,
        container: process.env.CONTAINER
    });

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: __dirname + '/fixture.txt',
        contents: new Buffer('unicorns')
    }));

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: __dirname + '/fixture/fixture2.txt',
        contents: new Buffer('unicorns')
    }));
    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: __dirname + '/fixture/fixture6/fixture6/fixture6.txt',
        contents: new Buffer('unicorns')
    }));
    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: __dirname + '/fixture/fixture5.txt',
        contents: new Buffer('unicorns')
    }));
    var times = 0;
    stream.on('data', function () {
        times++;
        if (times === 4){
            cb();
        }
    });
});