# gulp-upload-azure

** Yet another gulp plugin for uploading files to Azure Blob Storage and set container Blob Public. **

## Options

### account

Required.

### key

Required.

### container

Required.

### host 

Optional, custom Azure Blob Host.

### contentEncoding

Optional, like `gzip`, default is `null`.

### cacheControl 

Optional, default is `null`, see [Cache-Control Spec](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9).

### verbose

Optional.


## Sample `gulpfile.js`

```js
var gulp = require('gulp');
var uploadAzure = require('gulp-upload-azure');
var gutil = require('gulp-util');

gulp.task('default', function() {
    return gulp.src('src/**').pipe(uploadAzure({
        account: 'xxx',
        key: 'xxxxxxxx',
        container: 'xxx',
    })).pipe(gutil.noop());
});
```

or

```js
var gulp = require('gulp');
var uploadAzure = require('gulp-upload-azure');
var gutil = require('gulp-util');
var gzip = require('gulp-gzip');
var runSequence = require('run-sequence');

gulp.task('gzip', function() {
    return gulp.src('static/**/*.{css,js,html}').pipe(gzip({
        append: false,
        threshold: false,
        gzipOptions: {
            level: 9,
            memLevel: 9
        }
    })).pipe(uploadAzure({
        account: 'xxxx',
        key: 'xyzssssssssssssssss',
        host: 'https://xxxx.blob.core.chinacloudapi.cn/',
        container: '$root',
        contentEncoding: 'gzip'
    })).pipe(gutil.noop());
});

gulp.task('withoutGzip', function() {
    return gulp.src('static/**/!(*.css|*.js|*.html)').pipe(uploadAzure({
        account: 'xxxx',
        key: 'xyzssssssssssssssss',
        host: 'https://xxxx.blob.core.chinacloudapi.cn/',
        container: '$root'
    })).pipe(gutil.noop());
});

gulp.task('default', function(callback) {
    runSequence(['gzip', 'withoutGzip'], callback);
});
```