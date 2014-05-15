var paths = {
    src: {
        images: 'src/images/**/*',
        scripts: [
            'src/scripts/test.js'
        ],
        less: 'src/less',
        fonts: 'src/fonts/**/*'
    },
    dist: './build/'
},
    gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    imagemin = require('gulp-imagemin'),
    less = require('gulp-less'),
    prefixer = require('gulp-autoprefixer'),
    pipe = require('multipipe'),
    stylish = require('jshint-stylish'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    minify = require('gulp-minify-css'),
    notify = require("gulp-notify"),
    lr = require('tiny-lr'),
    server = lr();

gulp.task('less', function() {
    return pipe(
        gulp.src(paths.src.less + "/*.less"),
        less({
            paths: [paths.src.less],
            compress: false
        }),
        prefixer('last 2 versions', 'ie 8'),
        concat("main.debug.css"),
        gulp.dest(paths.dist + '/styles'),
        minify(),
        rename('main.css'),
        gulp.dest(paths.dist + '/styles'),
        livereload(server),
        notify("[LESS] OK")
    );
});

gulp.task('images', function() {
    return pipe(
        gulp.src(paths.src.images),
        imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }),
        gulp.dest(paths.dist + '/images'),
        notify("[IMAGES] OK")
    );
});

gulp.task('fonts', function() {
    return pipe(
        gulp.src(paths.src.fonts),
        gulp.dest(paths.dist + '/fonts'),
        notify("[FONTS] OK")
    );
});

gulp.task('scripts', function() {
    return pipe(
        gulp.src(paths.src.scripts),
        jshint(),
        jshint.reporter(stylish),
        concat('main.debug.js'),
        gulp.dest(paths.dist + '/scripts'),
        uglify(),
        rename('main.js'),
        gulp.dest(paths.dist + '/scripts'),
        livereload(server),
        notify("[SCRIPTS] OK")
    );
});

gulp.task('livereload', function() {
    server.listen(35729, function(err) {
        if (err) {
            return console.log(err);
        }
    });
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['lint', 'concat_minify']);
    gulp.watch(paths.images, ['images']);
    gulp.watch(paths.less, ['less']);
    gulp.watch(paths.fonts, ['fonts']);
});

gulp.task('dev', ['livereload', 'watch']);

gulp.task('build', ['less', 'images', 'fonts', 'scripts']);
