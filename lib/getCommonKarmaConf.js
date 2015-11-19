var getWebpackCommon = require('./getWebpackCommon');
var path = require('path');

module.exports = function () {
  var indexSpec = path.join(process.cwd(), 'tests/index.spec.js');
  var files = [
    require.resolve('console-polyfill/index.js'),
    require.resolve('es5-shim/es5-shim.js'),
    require.resolve('es5-shim/es5-sham.js'),
    require.resolve('html5shiv/dist/html5shiv.js'),
    indexSpec,
  ];
  var preprocessors = {};
  preprocessors[indexSpec] = ['webpack', 'sourcemap'];
  return {
    frameworks: ['mocha'],
    files: files,
    preprocessors: preprocessors,
    webpack: {
      resolveLoader: getWebpackCommon.getResolveLoader(),
      devtool: 'inline-source-map',
      resolve: getWebpackCommon.getResolve(),
      module: {
        loaders: getWebpackCommon.getLoaders().concat(getWebpackCommon.getCssLoaders()),
      },
    },
    webpackServer: {
      noInfo: true, //please don't spam the console when running in karma!
    },
  };
};
