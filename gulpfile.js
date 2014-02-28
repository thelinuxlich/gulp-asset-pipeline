var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    pipe = require('multipipe'),
    stylish = require('jshint-stylish'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    src_path = './src/*.js',
    build_path = './build/',
    lint_fail;

gulp.task('lint', function() {
    lint_fail = false;

    return pipe(
        gulp.src(src_path),
        jshint(),
        jshint.reporter(stylish),
        jscs()
    ).on("error", function(err) {
        console.log(err.message);
        lint_fail = true;
        this.emit('end');
    });
});

gulp.task('concat_minify',['lint'], function() {
    if(!lint_fail) {
        return pipe(
            gulp.src(src_path),
            concat('all.js'),
            gulp.dest(build_path),
            uglify(),
            rename('all.min.js'),
            gulp.dest(build_path)
        );
    } else {
        console.log("Not minifying due to lint error");
    }
});

gulp.task('watch', function () {
    gulp.watch(src_path, ['lint','concat_minify']);
});

gulp.task('default', ['lint', 'concat_minify','watch']);