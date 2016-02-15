var gulp = require('gulp');
var path = require('path');
var resolveCwd = require('./util').resolveCwd;
var cwd = process.cwd();
var pkg = require(resolveCwd('package.json'));
var through2 = require('through2');
var webpack = require('webpack');
var shelljs = require('shelljs');
var jsx2example = require('gulp-jsx2example');
var getWebpackConfig = require('./getWebpackConfig');
var babel = require('gulp-babel');
var runCmd = require('./util').runCmd;
var fs = require('fs-extra');
var lessPath = new RegExp('(["\']' + pkg.name + ')\/assets\/([^.\'"]+).less', 'g');
var argv = require('minimist')(process.argv.slice(2));
var babelConfig = require('./getBabelCommonConfig')();

gulp.task('browser-test', function (done) {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.phantomjs.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('chrome-test', function (done) {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.chrome.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('browser-test-cover', function (done) {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.phantomjs.coverage.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('lint', ['check-deps'], function (done) {
  var eslintBin = require.resolve('eslint/bin/eslint');
  var eslintConfig = path.join(__dirname, './eslintrc');
  var projectEslint = resolveCwd('./.eslintrc');
  if (fs.existsSync(projectEslint)) {
    eslintConfig = projectEslint;
  }
  var args = [eslintBin, '-c', eslintConfig, '--ext', '.js,.jsx', 'src', 'tests', 'examples'];
  runCmd('node', args, done);
});

function printResult(stats) {
  stats = stats.toJson();

  (stats.errors || []).forEach(function (err) {
    console.error('error', err);
  });

  stats.assets.forEach(function (item) {
    var size = (item.size / 1024.0).toFixed(2) + 'kB';
    console.log('generated', item.name, size);
  });
}

function cleanCompile() {
  if (fs.existsSync(resolveCwd('lib'))) {
    shelljs.rm('-rf', resolveCwd('lib'));
  }
  if (fs.existsSync(resolveCwd('assets'))) {
    shelljs.rm('-rf', resolveCwd('assets/*.css'));
  }
}

function cleanBuild() {
  if (fs.existsSync(resolveCwd('build'))) {
    shelljs.rm('-rf', resolveCwd('build'));
  }
}

function clean() {
  cleanCompile();
  cleanBuild();
}

gulp.task('webpack', ['cleanBuild'], function (done) {
  if (fs.existsSync(resolveCwd('./examples/'))) {
    webpack(getWebpackConfig(), function (err, stats) {
      if (err) {
        console.error('error', err);
      }
      printResult(stats);
      done(err);
    });
  } else {
    done();
  }
});

gulp.task('clean', clean);

gulp.task('cleanCompile', cleanCompile);

gulp.task('cleanBuild', cleanBuild);

gulp.task('gh-pages', ['build'], function (done) {
  console.log('gh-paging');
  if (pkg.scripts['pre-gh-pages']) {
    shelljs.exec('npm run pre-gh-pages');
  }
  if (fs.existsSync(resolveCwd('./examples/'))) {
    var ghPages = require('gh-pages');
    ghPages.publish(resolveCwd('build'), {
      depth: 1,
      logger: function (message) {
        console.log(message);
      },
    }, function () {
      cleanBuild();
      console.log('gh-paged');
      done();
    });
  } else {
    done();
  }
});

gulp.task('build', ['webpack'], function () {
  if (fs.existsSync(resolveCwd('./examples/'))) {
    return gulp
      .src([resolveCwd('./examples/') + '*.*'])
      .pipe(jsx2example({
        dest: 'build/examples/',
      })) // jsx2example(options)
      .pipe(gulp.dest('build/examples/'));
  }
});

gulp.task('less', ['cleanCompile'], function () {
  var less = require('gulp-less');
  var autoprefixer = require('autoprefixer-core');
  return gulp.src('./assets/' + '*.less')
    .pipe(less())
    .pipe(through2.obj(function (file, encoding, next) {
      file.contents = new Buffer(autoprefixer.process(file.contents.toString(encoding)).css, encoding);
      this.push(file);
      next();
    }))
    .pipe(gulp.dest('./assets/'));
});

gulp.task('pub', ['publish', 'gh-pages'], function () {
  console.log('tagging');
  var version = pkg.version;
  shelljs.cd(cwd);
  shelljs.exec('git tag ' + version);
  shelljs.exec('git push origin ' + version + ':' + version);
  shelljs.exec('git push origin master:master');
  console.log('tagged');
});

gulp.task('saucelabs', function (done) {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.saucelabs.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('babel', ['cleanCompile'], function () {
  return gulp.src(['src/' + '**/' + '*.js', 'src/' + '**/' + '*.jsx'])
    .pipe(through2.obj(function (file, encoding, next) {
      file.contents = new Buffer(file.contents.toString(encoding).
      replace(lessPath, function (match, m1, m2) {
        return m1 + '/assets/' + m2 + '.css';
      }), encoding);
      this.push(file);
      next();
    }))
    .pipe(babel(babelConfig))
    .pipe(gulp.dest('lib'));
});

gulp.task('compile', ['babel', 'less']);

gulp.task('check-deps', function (done) {
  require('./checkDep')(done);
});

gulp.task('karma', function (done) {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  if (argv['single-run']) {
    args.push('--single-run');
  }
  runCmd('node', args, done);
});

gulp.task('publish', ['compile'], function () {
  console.log('publishing');
  var npm = argv.tnpm ? 'tnpm' : 'npm';
  shelljs.exec(npm + ' publish');
  cleanCompile();
  console.log('published');
  if (npm === 'npm') {
    var cnpm = shelljs.which('cnpm');
    if (cnpm) {
      shelljs.exec('cnpm sync');
    }
  }
});

gulp.task('compile_watch', ['compile'], function () {
  console.log('file changed');
  var outDir = argv['out-dir'];
  if (outDir) {
    fs.copySync(resolveCwd('lib'), path.join(outDir, 'lib'));
    if (fs.existsSync(resolveCwd('assets'))) {
      fs.copySync(resolveCwd('assets'), path.join(outDir, 'assets'));
    }
  }
});

gulp.task('watch', ['compile_watch'], function () {
  gulp.watch([
    'src/**/*.js?(x)',
    'assets/**/*.less',
  ], ['compile_watch']);
});
