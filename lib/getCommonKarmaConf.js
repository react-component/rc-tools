var getWebpackCommon = require('./getWebpackCommon');
var path = require('path');

module.exports = function () {
  var indexSpec = path.join(process.cwd(), 'tests/index.spec.js');
  var files = [
    path.join(__dirname, '../node_modules/console-polyfill/index.js'),
    path.join(__dirname, '../node_modules/es5-shim/es5-shim.js'),
    path.join(__dirname, '../node_modules/html5shiv/dist/html5shiv.js'),
    indexSpec];
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
