var paths = {
    src: {
        sprites: 'assets/sprites/**/*.png',
        images: 'assets/img/**/*',
        scripts: [
            'assets/js/test.js'
        ],
        less: 'assets/css/less/**/*.less',
        fonts: 'assets/fonts/**/*',
        php: './**/*.php'
    },
    dist: './build'
},
    gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    imagemin = require('gulp-imagemin'),
    less = require('gulp-less'),
    prefixer = require('gulp-autoprefixer'),
    pipe = require('multipipe'),
    summary = require('jshint-summary'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    minify = require('gulp-minify-css'),
    notify = require("gulp-notify"),
    lr = require('tiny-lr'),
    changed = require('gulp-changed'),
    spritesmith = require('gulp.spritesmith'),
    runSequence = require('run-sequence'),
    server = lr();

gulp.task('less', function() {
    return pipe(
        gulp.src([paths.src.less, paths.dist + "/css/sprite.css"]),
        less({
            compress: false
        }),
        prefixer('last 2 versions', 'ie 8'),
        concat("main.debug.css"),
        gulp.dest(paths.dist + '/css'),
        minify(),
        rename('main.css'),
        gulp.dest(paths.dist + '/css'),
        livereload(server),
        notify("[LESS] OK")
    );
});

gulp.task('images', function() {
    return pipe(
        gulp.src(paths.src.images),
        changed(paths.dist + '/img'),
        imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }),
        gulp.dest(paths.dist + '/img'),
        notify("[IMAGES] OK")
    );
});

gulp.task('fonts', function() {
    return pipe(
        gulp.src(paths.src.fonts),
        changed(paths.dist + '/fonts'),
        gulp.dest(paths.dist + '/fonts'),
        notify("[FONTS] OK")
    );
});

gulp.task('scripts', function() {
    return pipe(
        gulp.src(paths.src.scripts),
        jshint(),
        jshint.reporter(summary({
            verbose: true,
            reasonCol: 'cyan,bold'
        })),
        concat('main.debug.js'),
        gulp.dest(paths.dist + '/js'),
        uglify(),
        rename('main.js'),
        gulp.dest(paths.dist + '/js'),
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

gulp.task('sprite', function() {
    var spriteData = gulp.src(paths.src.sprites).pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css'
    }));
    spriteData.img.pipe(gulp.dest(paths.dist + "/css"));
    spriteData.css.pipe(gulp.dest(paths.dist + "/css"));
});

gulp.task('watch', function() {
    gulp.watch(paths.src.scripts, ['scripts']);
    gulp.watch(paths.src.images, ['images']);
    gulp.watch(paths.src.less, function() {
        runSequence('sprite', 'less');
    });
    gulp.watch(paths.src.sprites, function() {
        runSequence('sprite', 'less');
    });
    gulp.watch(paths.src.fonts, ['fonts']);
    gulp.watch(paths.src.php).on('change', function(file) {
        server.changed(file.path);
    });
});

gulp.task('dev', ['livereload', 'watch']);

gulp.task('build', runSequence('sprite', 'less', ['images', 'fonts', 'scripts']));
