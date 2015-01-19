# gulp-upload-azure

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