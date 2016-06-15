'use strict';

var gulp = require('gulp');
var path = require('path');
var resolveCwd = require('./resolveCwd');
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
var lessPath = new RegExp(`(["\']${pkg.name})\/assets\/([^.\'"]+).less`, 'g');
var argv = require('minimist')(process.argv.slice(2));
var babelConfig = require('./getBabelCommonConfig')();
var postcss = require('gulp-postcss');
var gulpEs3ify = require('./gulpEs3ify');
const getNpm = require('./getNpm');
const selfPackage = require('../package.json');
const chalk = require('chalk');
const getNpmArgs = require('./util').getNpmArgs;
const ts = require('gulp-typescript');
const merge2 = require('merge2');
const tsConfig = require('./getTSCommonConfig')();

gulp.task('test', (done) => {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.phantomjs.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('chrome-test', (done) => {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.chrome.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('coverage', (done) => {
  if (fs.existsSync(resolveCwd('coverage'))) {
    shelljs.rm('-rf', resolveCwd('coverage'));
  }
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.phantomjs.coverage.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

gulp.task('js-lint', ['check-deps'], (done) => {
  if (argv['js-lint'] === false) {
    return done();
  }
  var eslintBin = require.resolve('eslint/bin/eslint');
  var eslintConfig = path.join(__dirname, './eslintrc');
  var projectEslint = resolveCwd('./.eslintrc');
  if (fs.existsSync(projectEslint)) {
    eslintConfig = projectEslint;
  }
  var args = [eslintBin, '-c', eslintConfig, '--ext', '.js,.jsx', 'src', 'tests', 'examples'];
  runCmd('node', args, done);
});

gulp.task('ts-lint', ['check-deps'], (done) => {
  var tslintBin = require.resolve('tslint/bin/tslint');
  var tslintConfig = path.join(__dirname, './tslint.json');
  var projectTslint = resolveCwd('./tslint.json');
  if (fs.existsSync(projectTslint)) {
    tslintConfig = projectTslint;
  }
  var args = [tslintBin, '-c', tslintConfig, 'src/**/*.tsx', 'tests/**/*.tsx', 'examples/**/*.tsx'];
  runCmd('node', args, done);
});

gulp.task('lint', ['ts-lint', 'js-lint']);

function printResult(stats) {
  stats = stats.toJson();

  (stats.errors || []).forEach((err) => {
    console.error('error', err);
  });

  stats.assets.forEach((item) => {
    var size = `${(item.size / 1024.0).toFixed(2)}kB`;
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

gulp.task('webpack', ['cleanBuild'], (done) => {
  if (fs.existsSync(resolveCwd('./examples/'))) {
    webpack(getWebpackConfig(), (err, stats) => {
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

gulp.task('gh-pages', ['build'], (done) => {
  console.log('gh-paging');
  if (pkg.scripts['pre-gh-pages']) {
    shelljs.exec('npm run pre-gh-pages');
  }
  if (fs.existsSync(resolveCwd('./examples/'))) {
    var ghPages = require('gh-pages');
    ghPages.publish(resolveCwd('build'), {
      depth: 1,
      logger(message) {
        console.log(message);
      },
    }, () => {
      cleanBuild();
      console.log('gh-paged');
      done();
    });
  } else {
    done();
  }
});

gulp.task('build', ['webpack'], () => {
  if (fs.existsSync(resolveCwd('./examples/'))) {
    const dir = resolveCwd('./examples/');
    var files = fs.readdirSync(dir);
    files = files.map(f => path.join(dir, f));
    const filesMap = {};
    files.forEach((f) => {
      filesMap[f] = 1;
    });
    files.forEach((f) => {
      if (f.match(/\.tsx?$/)) {
        var js = f.replace(/\.tsx?$/, '.js');
        if (filesMap[js]) {
          delete filesMap[js];
        }
        js = f.replace(/\.tsx?$/, '.jsx');
        if (filesMap[js]) {
          delete filesMap[js];
        }
      }
    });
    return gulp
      .src(Object.keys(filesMap))
      .pipe(jsx2example({
        dest: 'build/examples/',
      })) // jsx2example(options)
      .pipe(gulp.dest('build/examples/'));
  }
  return undefined;
});

gulp.task('css', ['cleanCompile'], () => {
  var less = require('gulp-less');
  return gulp.src('./assets/' + '*.less')
    .pipe(less())
    .pipe(postcss([require('./getAutoprefixer')()]))
    .pipe(gulp.dest('./assets/'));
});

gulp.task('pub', ['publish', 'gh-pages'], () => {
  console.log('tagging');
  var version = pkg.version;
  shelljs.cd(cwd);
  shelljs.exec(`git tag ${version}`);
  shelljs.exec(`git push origin ${version}:${version}`);
  shelljs.exec('git push origin master:master');
  console.log('tagged');
});

gulp.task('saucelabs', (done) => {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.saucelabs.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  runCmd('node', args, done);
});

function babelify(js) {
  function replacer(match, m1, m2) {
    return `${m1}/assets/${m2}.css`;
  }

  return js.pipe(babel(babelConfig))
    .pipe(gulpEs3ify())
    .pipe(gulp.dest('lib'))
    .pipe(through2.obj(function (file, encoding, next) {
      file.contents = new Buffer(file.contents.toString(encoding)
        .replace(lessPath, replacer), encoding);
      this.push(file);
      next();
    }));
}

gulp.task('js', ['cleanCompile'], () => {
  const js = babelify(gulp.src(['src/' + '**/' + '*.js', 'src/' + '**/' + '*.jsx']));
  const tsResult = gulp.src(['src/' + '**/' + '*.ts', 'src/' + '**/' + '*.tsx',
    'typings/**/*.d.ts']).pipe(ts(tsConfig));
  const tsFiles = babelify(tsResult.js);
  const tsd = tsResult.dts.pipe(gulp.dest('lib'));
  return merge2([js, tsFiles, tsd]);
});

gulp.task('compile', ['js', 'css']);

gulp.task('check-deps', (done) => {
  require('./checkDep')(done);
});

gulp.task('karma', (done) => {
  var karmaBin = require.resolve('karma/bin/karma');
  var karmaConfig = path.join(__dirname, './karma.conf.js');
  var args = [karmaBin, 'start', karmaConfig];
  if (argv['single-run']) {
    args.push('--single-run');
  }
  runCmd('node', args, done);
});

gulp.task('publish', ['compile'], () => {
  console.log('publishing');
  var npm = argv.tnpm ? 'tnpm' : 'npm';
  if (pkg.scripts['pre-publish']) {
    shelljs.exec(`npm run pre-publish`);
  }
  shelljs.exec(`${npm} publish --with-rc-tools`);
  cleanCompile();
  console.log('published');
  if (npm === 'npm') {
    var cnpm = shelljs.which('cnpm');
    if (cnpm) {
      shelljs.exec('cnpm sync');
    }
  }
});

gulp.task('compile_watch', ['compile'], () => {
  console.log('file changed');
  var outDir = argv['out-dir'];
  if (outDir) {
    fs.copySync(resolveCwd('lib'), path.join(outDir, 'lib'));
    if (fs.existsSync(resolveCwd('assets'))) {
      fs.copySync(resolveCwd('assets'), path.join(outDir, 'assets'));
    }
  }
});

gulp.task('watch', ['compile_watch'], () => {
  gulp.watch([
    'src/**/*.js?(x)',
    'assets/**/*.less',
  ], ['compile_watch']);
});

gulp.task('watch-tsc', (done) => {
  var tsBin = require.resolve('typescript/bin/tsc');
  var args = [tsBin, '--watch'];
  runCmd('node', args, done);
});


gulp.task('update-self', ['compile'], (done) => {
  getNpm((npm) => {
    console.log(`${npm} updating ${selfPackage.name}`);
    runCmd(npm, ['update', selfPackage.name], (c) => {
      console.log(`${npm} update ${selfPackage.name} end`);
      done(c);
    });
  });
});

function reportError() {
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
  console.log(chalk.bgRed('!! `npm publish` is forbidden for this package. !!'));
  console.log(chalk.bgRed('!! Use `npm run pub` instead.        !!'));
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}

gulp.task('guard', (done) => {
  const npmArgs = getNpmArgs();
  if (npmArgs) {
    for (let arg = npmArgs.shift(); arg; arg = npmArgs.shift()) {
      if (/^pu(b(l(i(sh?)?)?)?)?$/.test(arg) && npmArgs.indexOf('--with-rc-tools') < 0) {
        reportError();
        done(1);
        return;
      }
    }
  } else {
    done(1);
    return;
  }
  done();
});
