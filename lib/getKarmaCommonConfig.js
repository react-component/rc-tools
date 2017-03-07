'use strict';

var getWebpackCommonConfig = require('./getWebpackCommonConfig');
var resolveCwd = require('./resolveCwd');
var assign = require('object-assign');

module.exports = function () {
  var indexSpec = resolveCwd('tests/index.js');
  var files = [
    require.resolve('console-polyfill/index.js'),
    require.resolve('es5-shim/es5-shim.js'),
    require.resolve('es5-shim/es5-sham.js'),
    require.resolve('html5shiv/dist/html5shiv.js'),
    require.resolve('es6-promise/dist/es6-promise.js'),
    require.resolve('../public/modernizr.js'),
    indexSpec,
  ];
  var preprocessors = {};
  preprocessors[indexSpec] = ['webpack', 'sourcemap'];
  return {
    reporters: ['mocha'],
    client: {
      mocha: {
        reporter: 'html', // change Karma's debug.html to the mocha web reporter
        ui: 'bdd',
      },
    },
    frameworks: ['mocha'],
    files,
    preprocessors,
    webpack: assign({
      resolveLoader: getWebpackCommonConfig.getResolveLoader(),
      devtool: '#inline-source-map',
      resolve: getWebpackCommonConfig.getResolve(),
      module: {
        loaders: getWebpackCommonConfig.getLoaders().concat(getWebpackCommonConfig.getCssLoaders()),
      },
    }, getWebpackCommonConfig.getLoaderConfig()),
    webpackServer: {
      noInfo: true, // please don't spam the console when running in karma!
    },
    plugins: [
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('karma-coveralls'),
      require('karma-firefox-launcher'),
      require('karma-ie-launcher'),
      require('karma-mocha'),
      require('karma-mocha-reporter'),
      require('karma-phantomjs-launcher'),
      require('karma-safari-launcher'),
      require('karma-sauce-launcher'),
      require('karma-sourcemap-loader'),
      require('karma-webpack'),
    ],
  };
};
