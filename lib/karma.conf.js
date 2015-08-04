var getWebpackCommon = require('./getWebpackCommon');
var path = require('path');

module.exports = function conf(config) {
  var browsers = ['Chrome', 'Firefox', 'Safari'];
  if (process.platform === 'win32') {
    browsers.push('IE');
  }
  var indexSpec = path.join(process.cwd(), 'tests/index.spec.js');
  var files = [indexSpec];
  var preprocessors = {};
  preprocessors[indexSpec] = ['webpack', 'sourcemap'];
  config.set({
    browsers: browsers,
    frameworks: ['mocha'],
    // singleRun:true,
    files: files,
    preprocessors: preprocessors,
    reporters: ['dots'],
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
  });
};
