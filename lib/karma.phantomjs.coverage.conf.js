'use strict';

var assign = require('object-assign');
var resolveCwd = require('./util').resolveCwd;
var getKarmaCommonConfig = require('./getKarmaCommonConfig');
var getWebpackCommonConfig = require('./getWebpackCommonConfig');
var getBabelCommonConfig = require('./getBabelCommonConfig');

module.exports = function conf(config) {
  var commonConfig = getKarmaCommonConfig();
  var files = [resolveCwd('tests/index.spec.js')];
  var preprocessors = {};
  preprocessors[files[0]] = 'webpack';
  var reporters = ['progress', 'coverage'];
  var coverageReporter = {
    reporters: [
      {
        type: 'lcov',
        subdir: '.',
      },
      { type: 'text' },
    ],
    dir: resolveCwd('coverage/'),
  };
  if (process.env.TRAVIS_JOB_ID) {
    reporters = ['coverage', 'coveralls'];
  }
  config.set(assign({}, commonConfig, {
    files,
    preprocessors,
    webpack: assign({}, commonConfig.webpack, {
      // *optional* isparta options: istanbul behind isparta will use it
      isparta: {
        babel: getBabelCommonConfig(),
        embedSource: true,
        noAutoWrap: true,
      },

      module: {
        loaders: getWebpackCommonConfig().getCssLoaders(),
        preLoaders: [
          // transpile and instrument only testing sources with isparta
          {
            test: /\.jsx?$/,
            exclude: /(src\/)|(node_modules\/)/,
            loader: 'babel',
            query: getBabelCommonConfig(),
          },
          {
            test: /\.jsx?$/,
            include: /src\//,
            loader: 'isparta',
          },
        ],
      },
    }),
    reporters,
    coverageReporter,
    browsers: ['PhantomJS'],
    singleRun: true,
    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered
      // (useful if karma exits without killing phantom)
      exitOnResourceError: true,
    },
  }));
};
