var gulp = require('gulp');
var path = require('path');
var cwd = process.cwd();
var packageInfo = require(path.join(cwd, 'package.json'));
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var fs = require('fs-extra');
var jsHintConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jshintrc')));
var jsCsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jscsrc')));
var through2 = require('through2');
var spawn = require('child_process').spawn;
var mUtils = require('modulex-util');

gulp.task('browser-test', function (done) {
  var port = process.env.npm_package_config_port;
  var ps = spawn('mocha-phantomjs', ['http://localhost:' + port + '/tests/runner.html']);

  ps.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  ps.stderr.on('data', function (data) {
    process.stderr.write(data);
  });

  ps.on('close', function (code) {
    done(code);
  });
});

gulp.task('browser-test-cover', function (done) {
  var port = process.env.npm_package_config_port;
  var ps = spawn('mocha-phantomjs', ['-R',
    'node_modules/rc-server/node_modules/node-jscover-coveralls/lib/reporters/mocha',
    'http://localhost:' + port + '/tests/runner.html?coverage']);

  ps.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  ps.stderr.on('data', function (data) {
    process.stderr.write(data);
  });

  ps.on('close', function (code) {
    done(code);
  });
});

gulp.task('lint', function () {
  return gulp.src('./lib/**/*.js')
    .pipe(require('gulp-reactify')({
      transformOptions :{
        harmony:false
      }
    }))
    .pipe(jshint(jsHintConfig))
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs(jsCsConfig));
});

gulp.task('jsx2html', function () {
  var tpl = fs.readFileSync(path.join(__dirname, 'jsx2html.tpl'), {
    encoding: 'utf-8'
  });
  var highlightJs = require('highlight.js');
  var webpackConfig = require(path.join(cwd, 'webpack.config'));
  var entries = webpackConfig.entry;
  var exampleDir = path.join(cwd, 'build', 'examples');
  var indexHtml = path.join(exampleDir, 'index.html');
  var indexContent = '<style>li {margin:10px;}</style><h1 style="text-align: center;margin:20px;">' + packageInfo.name + ' examples</h1><ul>';
  for (var k in entries) {
    var file = entries[k][0];
    var source = path.join(cwd, file);
    var code = highlightJs.highlightAuto(fs.readFileSync(source, {
      encoding: 'utf-8'
    })).value;
    var appHtml = path.join(cwd, 'build', file.replace(/\.js$/, '.html'));
    var appJs = path.join(cwd, 'build', file);
    fs.mkdirsSync(path.dirname(appHtml));
    var commonJs = path.join(cwd, 'build', 'examples', 'common.js');
    var commonPath = path.relative(path.dirname(appHtml), commonJs);
    var html = mUtils.substitute(tpl, {
      common: commonPath,
      app: path.basename(source),
      code: code
    }, /\\?\{\{([^{}]+)\}\}/g);
    fs.writeFileSync(appHtml, html, {
      encoding: 'utf-8'
    });
    indexContent += '<li><a href="' + path.relative(exampleDir, appHtml) + '">' + path.relative(exampleDir, appJs) + '</a></li>';
  }
  indexContent += '</ul>';
  fs.writeFileSync(indexHtml, indexContent, {
    encoding: 'utf-8'
  });
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
