'use strict';

var gulp         = require('gulp');
var babel        = require('gulp-babel');
var browserify   = require('gulp-browserify');
var clean        = require('gulp-clean');
var concat       = require('gulp-concat');
var plumber      = require('gulp-plumber');
var rename       = require('gulp-rename');
var uglify       = require('gulp-uglify');
var webserver    = require('gulp-webserver');
var runSequence  = require('run-sequence');

gulp.task('clean', function() {
	return gulp.src(['build', 'dist'], {read: false} )
			.pipe(plumber())
			.pipe(clean());
});

gulp.task('babel', function() {
		return gulp.src('src/**/*.js')
			.pipe(plumber())
			.pipe(babel())
			.pipe(gulp.dest('lib'));
});

gulp.task('browserify', function() {
		return gulp.src('lib')
			.pipe(plumber())
			.pipe(browserify())
			.pipe(rename('logolite.js'))
			.pipe(gulp.dest('build/js'));
});

gulp.task('uglify', function() {
		return gulp.src('build/js/logolite.js')
			.pipe(concat('logolite.min.js'))
			.pipe(uglify())
			.pipe(gulp.dest('build/js'));
});

gulp.task('deploy', function() {
	return gulp.src([
			'build/js/logolite*.js'
		], { base: 'build' })
		.pipe(gulp.dest('dist'));
});

gulp.task('build', function(callback) {
	runSequence('clean', 'babel', 'browserify', 'uglify', 'deploy', callback);
});

gulp.task('run', function() {
	gulp.src([ './test/web', './dist' ]).pipe(webserver({
		host: '0.0.0.0',
		port: 8888,
		livereload: {
			enable: true,
			port: 38888
		},
		open: (function() {
			return 'http://localhost:8888/index.html'
		})()
	}));
});

gulp.task('default', ['build', 'run']);
