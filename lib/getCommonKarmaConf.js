var getWebpackCommon = require('./getWebpackCommon');
var path = require('path');

module.exports = function () {
  var indexSpec = path.join(process.cwd(), 'tests/index.spec.js');
  var files = [indexSpec];
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
