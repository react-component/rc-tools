'use strict';

var getKarmaConfig = require('./getKarmaConfig');
var resolveCwd = require('./resolveCwd');
var getKarmaCommonConfig = require('./getKarmaCommonConfig');

module.exports = function conf(config) {
  var commonConfig = getKarmaCommonConfig();
  var preprocessors = {};
  preprocessors[commonConfig.files[commonConfig.files.length - 1]] = 'webpack';
  var reporters = ['progress', 'coverage'];
  var coverageReporter = {
    reporters: [
      {
        type: 'lcov',
        subdir: '.',
      },
      {
        type: 'text',
      },
    ],
    dir: resolveCwd('coverage/'),
  };
  if (process.env.TRAVIS_JOB_ID) {
    reporters = ['coverage', 'coveralls'];
  }
  commonConfig.webpack.module.postLoaders = [
    {
      test: /\.jsx?$/,
      include: /src\//,
      loader: 'istanbul-instrumenter',
    },
  ];
  config.set(getKarmaConfig('coverage', {
    preprocessors,
    webpack: commonConfig.webpack,
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
