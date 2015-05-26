var gulp = require('gulp');
var path = require('path');
var cwd = process.cwd();
var packageInfo = require(path.join(cwd, 'package.json'));
var fs = require('fs-extra');
var through2 = require('through2');
var mUtils = require('modulex-util');
var webpack = require('webpack');
var shelljs = require('shelljs');
var serverFn = path.join(cwd, 'server-fn.js');
var serverExists = fs.existsSync(serverFn);


var srcPath = new RegExp('(["\']' + packageInfo.name + ')\/src\/', 'g');
var libPath = new RegExp('(["\']' + packageInfo.name + ')\/lib\/', 'g');

function replaceSrcToLib(modName) {
  return modName.replace(srcPath, function (m, m1) {
    return m1 + '/lib/';
  });
}

function replaceLibToSrc(modName) {
  return modName.replace(libPath, function (m, m1) {
    return m1 + '/src/';
  });
}

function startServer(cb) {
  var app;
  if (serverExists) {
    app = require(serverFn)();
  } else {
    app = require('rc-server')();
  }
  app.listen(function () {
    var port = this.address().port;
    console.log('start server at port:', port);
    cb.call(this, port);
  });
}

function getEntry() {
  var exampleDir = path.join(cwd, 'examples');
  var files = fs.readdirSync(exampleDir);
  var entry = {};
  files.forEach(function (f) {
    var extname = path.extname(f);
    var name = path.basename(f, extname);
    if (extname === '.js' || extname === '.jsx') {
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
    extensions: ['', '.js', '.jsx'],
    alias: alias
  };
  var name = packageInfo.name;
  alias[name] = cwd;
  return resolve;
}

function getWebConfig() {
  return {
    devtool: "#source-map",

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
        {
          test: /\.jsx$/,
          exclude: /node_modules/,
          loader: 'babel'
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel'
        },
        {test: /\.json$/, loader: 'json-loader'},
        {test: /\.css/, loader: 'style!css'},
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
  startServer(function (port) {
    var server = this;
    shelljs.exec(['mocha-phantomjs', 'http://localhost:' + port + '/tests/runner.html'].join(' '), function (code) {
      server.close(function (error) {
        done(error || code);
      });
    });
  })

});

gulp.task('browser-test-cover', function (done) {
  startServer(function (port) {
    var server = this;
    shelljs.exec(['mocha-phantomjs', '-R',
      'node_modules/rc-server/node_modules/node-jscover-coveralls/lib/reporters/mocha',
      'http://localhost:' + port + '/tests/runner.html?coverage'].join(' '), function (code) {
      server.close(function (error) {
        done(error || code);
      });
    });
  });
});

gulp.task('lint', function (done) {
  var eslintBin = path.join(__dirname, '../node_modules/.bin/eslint');
  var eslintConfig = path.join(__dirname, '../.eslintrc');
  var args = ['node', eslintBin, '-c', eslintConfig, ('src/*.*')];
  var cmd = args.join(' ');
  shelljs.exec(cmd, function (code) {
    done(code);
  });
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

gulp.task('webpack', ['clean', 'compile'], function (done) {
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
    var sourceContent = fs.readFileSync(source, {
      encoding: 'utf-8'
    });
    var code = highlightJs.highlightAuto(replaceSrcToLib(sourceContent)).value;
    var appHtml = path.join(cwd, 'build', file.replace(/\.jsx?$/, '.html'));
    var appJs = path.join(cwd, 'build', file);
    fs.mkdirsSync(path.dirname(appHtml));
    var commonJs = path.join(cwd, 'build', 'examples', 'common.js');
    var commonPath = path.relative(path.dirname(appHtml), commonJs);
    var html = mUtils.substitute(tpl, {
      common: commonPath,
      app: path.basename(source).replace(/\.jsx$/, '.js'),
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
  startServer(function (port) {
    var server = this;
    var saucelabsConfig = rcConfig.saucelabs || {};
    require('saucelabs-runner')({
      url: 'http://localhost:' + port + '/tests/runner.html',
      browsers: saucelabsConfig.browsers || [
        {browserName: 'chrome'},
        {browserName: 'firefox'},
        {browserName: 'internet explorer', version: 8},
        {browserName: 'internet explorer', version: 9},
        {browserName: 'internet explorer', version: 10},
        {browserName: 'internet explorer', version: 11, platform: 'Windows 8.1'}
      ]
    }).fin(function () {
      server.close(function (error) {
        done(error);
        setTimeout(function () {
          process.exit(0);
        }, 1000);
      });
    });
  });
});

var babel = require('gulp-babel');

gulp.task('compile', ['less'], function () {
  return gulp.src(['src/**/*.js', 'src/**/*.jsx'])
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('precommit', ['lint', 'compile']);
