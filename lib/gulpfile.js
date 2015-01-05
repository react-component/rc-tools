var gulp = require('gulp');
var path = require('path');
var cwd = process.cwd();
var packageInfo = require(path.join(cwd, 'package.json'));
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var fs = require('fs');
var jsHintConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jshintrc')));
var jsCsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jscsrc')));
var through2 = require('through2');

gulp.task('lint', function () {
  return gulp.src('./lib/**/*.js')
    .pipe(require('gulp-reactify')())
    .pipe(jshint(jsHintConfig))
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs(jsCsConfig));
});

gulp.task('less', function () {
  var less = require('gulp-less');
  var autoprefixer = require('autoprefixer-core');
  return gulp.src('./assets/*.less')
    .pipe(less())
    .pipe(through2.obj(function (file, encoding, next) {
      file.contents = new Buffer(autoprefixer.process(file.contents.toString(encoding)).css, encoding);
      this.push(file);
      next();
    }))
    .pipe(gulp.dest('./assets/'));
});

gulp.task('tag', function (done) {
  var cp = require('child_process');
  var version = packageInfo.version;
  cp.exec('git tag ' + version + ' | git push origin ' + version + ':' + version + ' | git push origin master:master', done);
});

gulp.task('history', function (done) {
  var ghHistory = require('gh-history');
  var repository = packageInfo.repository.url;
  var info = repository.match(/git@github.com:([^/]+)\/([^.]+).git/);
  if (info && info.length) {
    ghHistory.generateHistoryMD({
      user: info[1],
      repo: info[2],
      mdFilePath: './HISTORY.md'
    }, function () {
      done();
    });
  }
});

gulp.task('saucelabs', function (done) {
  require('saucelabs-runner')({
    browsers: [
      {browserName: 'chrome'},
      {browserName: 'firefox'},
      {browserName: 'internet explorer', version: 8},
      {browserName: 'internet explorer', version: 9},
      {browserName: 'internet explorer', version: 10},
      {browserName: 'internet explorer', version: 11, platform: 'Windows 8.1'}
    ]
  }).fin(function () {
    done();
    setTimeout(function () {
      process.exit(0);
    }, 1000);
  });
});
