'use strict';

var gulp = require('gulp'),
  rimraf = require('rimraf'),
  concat = require('gulp-concat'),
  cssmin = require('gulp-cssmin'),
  uglify = require('gulp-uglify'),
  eslint = require('gulp-eslint');

var paths = {
    webroot: './wwwroot/',
    module: './node_modules/',
    lib: './wwwroot/lib/'
};

paths.js = paths.webroot + 'js/**/*.js';
paths.minJs = paths.webroot + 'js/**/*.min.js';
paths.css = paths.webroot + 'css/**/*.css';
paths.minCss = paths.webroot + 'css/**/*.min.css';
paths.concatJsDest = paths.webroot + 'js/site.min.js';
paths.concatCssDest = paths.webroot + 'css/site.min.css';

// Task to copy referenced 3rd js packages from npm node_modules folder to lib folder under wwwroot
gulp.task('copy', ['clean'], function () {
    var npm = {
        'angular': 'angular/angular*.js',
        'angular-ui-bootstrap': 'angular-ui-bootstrap/dist/ui-bootstrap*.{js,css}',
        'angular-filter': 'angular-filter/dist/*.js',
        'angular-local-storage': 'angular-local-storage/dist/*.js',
        'bootstrap': 'bootstrap/dist/**/*.{js,map,css,ttf,svg,woff,woff2,eot}',
        'checklist-model': 'checklist-model/checklist-model*.js',
        'd3': 'd3/d3*.js',
        'font-awesome': 'font-awesome/**/*.{js,map,css,ttf,svg,woff,woff2,eot}',
        'jquery': 'jquery/dist/jquery*.{js,map}',
        'metisMenu': 'metisMenu/dist/*.{js,css}'
    }

    for (var destinationDir in npm) {
        gulp.src(paths.module + npm[destinationDir])
          .pipe(gulp.dest(paths.lib + destinationDir));
    }
});

gulp.task('clean:lib', function (callback) {
    rimraf(paths.lib, callback);
});

gulp.task('clean', ['clean:lib']);

// Task to run lint, setting file is .eslintrc.json
gulp.task('lint', () => {
    // ESLint ignores files with 'node_modules' paths. 
    // So, it's best to have gulp ignore the directory as well. 
    // Also, Be sure to return the stream from the task; 
    // Otherwise, the task may end before the stream has finished. 
    return gulp.src(['wwwroot/js/azurespeed/**/*.js', '!node_modules/**'])
        // eslint() attaches the lint output to the 'eslint' property 
        // of the file object so it can be used by other modules. 
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console. 
        // Alternatively use eslint.formatEach() (see Docs). 
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on 
        // lint error, return the stream and pipe to failAfterError last. 
        .pipe(eslint.failAfterError());
});