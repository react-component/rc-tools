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
var webpack = require('webpack');
var shelljs = require('shelljs');

function getEntry() {
  var exampleDir = path.join(cwd, 'examples');
  var files = fs.readdirSync(exampleDir);
  var entry = {};
  files.forEach(function (f) {
    var extname = path.extname(f);
    var name = path.basename(f, extname);
    if (extname === '.js') {
      var htmlFile = path.join(exampleDir, name + '.html');
      if (fs.existsSync(htmlFile)) {
        entry[name] = ['./examples/' + f];
      }
    }
  });
  return entry;
}

function getResolve() {
  var alias = {};
  var resolve = {
    root: cwd,
    alias: alias
  };
  var name = packageInfo.name;
  var assetsDir = path.join(cwd, 'assets');
  if (fs.existsSync(assetsDir)) {
    var files = fs.readdirSync(assetsDir);
    files.forEach(function (f) {
      var extname = path.extname(f);
      var basename = path.basename(f, extname);
      if (extname === '.less') {
        alias[name + '/assets/' + basename + '.css'] = 'assets/' + basename + '.css';
      }
    });
  }
  alias[name] = 'index.js';
  return resolve;
}

function getWebConfig() {
  return {
    resolveLoader: {
      root: path.join(__dirname, '../node_modules')
    },

    entry: getEntry(),

    output: {
      path: path.join(cwd, 'build', 'examples'),
      filename: '[name].js'
    },

    module: {
      loaders: [
        {test: /\.js$/, loader: 'jsx-loader?harmony'},
        {test: /\.json$/, loader: 'json-loader'},
        {test: /\.css/, loader: 'style!autoprefixer!css'},
        // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
        // loads bootstrap's css.
        {test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/font-woff"},
        {test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/font-woff"},
        {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/octet-stream"},
        {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file"},
        {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=image/svg+xml"}
      ]
    },

    resolve: getResolve(),

    externals: {
      react: "React"
    },

    plugins: [
      // ./robot is automatically detected as common module and extracted
      new webpack.optimize.CommonsChunkPlugin("common.js")
    ]
  };
}


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
      transformOptions: {
        harmony: false
      }
    }))
    .pipe(jshint(jsHintConfig))
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
    .pipe(jscs(jsCsConfig));
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

gulp.task('webpack', ['clean', 'less'], function (done) {
  webpack(getWebConfig(), function (err, stats) {
    if (err) console.error('error', err);
    printResult(stats);
    done(err);
  });
});

gulp.task('clean', function () {
  shelljs.rm('-rf', path.join(cwd, 'build'));
});

gulp.task('gh-pages', ['build'], function () {
  shelljs.cd(path.join(cwd, '../' + path.basename(cwd) + '-gh-pages'));
  shelljs.rm('-rf', 'build');
  shelljs.mkdir('build');
  shelljs.cp('-r', path.join(cwd, 'build'), '');
  shelljs.exec('git add --all');
  shelljs.exec('git commit -am "update examples at ' + Date.now() + '"');
  shelljs.exec('git push origin gh-pages:gh-pages');
});

gulp.task('build', ['webpack'], function () {
  var tpl = fs.readFileSync(path.join(__dirname, 'jsx2html.tpl'), {
    encoding: 'utf-8'
  });
  var highlightJs = require('highlight.js');
  var entries = getEntry();
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

gulp.task('tag', function () {
  var version = packageInfo.version;
  shelljs.cd(cwd);
  shelljs.exec('git tag ' + version);
  shelljs.exec('git push origin ' + version + ':' + version);
  shelljs.exec('git push origin master:master');
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

var rcConfig = {};
var rcConfigFile = path.join(cwd, 'rc.config.js');
if (fs.existsSync(rcConfigFile)) {
  rcConfig = require(rcConfigFile);
}
gulp.task('saucelabs', function (done) {
  var saucelabsConfig = rcConfig.saucelabs || {};
  require('saucelabs-runner')({
    browsers: saucelabsConfig.browsers || [
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
