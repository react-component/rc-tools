var path = require('path');
var resolveCwd = require('./util').resolveCwd;
var fs = require('fs-extra');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var getWebpackCommonConfig = require('./getWebpackCommonConfig');

function getEntry() {
  var exampleDir = resolveCwd('examples');
  var files = fs.readdirSync(exampleDir);
  var entry = {};
  files.forEach(function (file) {
    var extname = path.extname(file);
    var name = path.basename(file, extname);
    if (extname === '.js' || extname === '.jsx') {
      var htmlFile = path.join(exampleDir, name + '.html');
      if (fs.existsSync(htmlFile)) {
        entry[name] = ['./examples/' + file];
      }
    }
  });
  return entry;
}

module.exports = function () {
  var webpackConfig = getWebpackCommonConfig();
  return {
    devtool: '#source-map',

    resolveLoader: webpackConfig.getResolveLoader(),

    entry: getEntry(),

    output: {
      path: resolveCwd('build', 'examples'),
      filename: '[name].js',
    },

    module: {
      loaders: webpackConfig.getLoaders().concat(webpackConfig.getCssLoaders(true)),
    },

    resolve: webpackConfig.getResolve(),

    plugins: [
      new ExtractTextPlugin('[name].css', {
        disable: false,
        allChunks: true,
      }),
      // ./robot is automatically detected as common module and extracted
      new webpack.optimize.CommonsChunkPlugin('common', 'common.js'),
    ],
  };
};
