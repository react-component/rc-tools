'use strict';

var path = require('path');
var resolveCwd = require('./resolveCwd');
var fs = require('fs-extra');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var getWebpackCommonConfig = require('./getWebpackCommonConfig');

function getEntry() {
  var exampleDir = resolveCwd('examples');
  var files = fs.readdirSync(exampleDir);
  var entry = {};
  files.forEach((file) => {
    var extname = path.extname(file);
    var name = path.basename(file, extname);
    if (extname === '.js' || extname === '.jsx') {
      var htmlFile = path.join(exampleDir, `${name}.html`);
      if (fs.existsSync(htmlFile)) {
        entry[name] = [`./examples/${file}`];
      }
    }
  });
  return entry;
}

module.exports = (dev) => {
  var plugins = [];
  plugins.push(new ExtractTextPlugin('[name].css', {
    disable: false,
    allChunks: true,
  }));
  if (!dev) {
    plugins.push(new webpack.optimize.CommonsChunkPlugin('common', 'common.js'));
  }
  return {
    devtool: '#source-map',

    resolveLoader: getWebpackCommonConfig.getResolveLoader(),

    entry: getEntry(),

    output: {
      path: resolveCwd('build', 'examples'),
      filename: '[name].js',
    },

    module: {
      loaders: getWebpackCommonConfig.getLoaders()
        .concat(getWebpackCommonConfig.getCssLoaders(true)),
    },

    postcss: require('./postcssConfig'),

    resolve: getWebpackCommonConfig.getResolve(),

    plugins,
  };
};
