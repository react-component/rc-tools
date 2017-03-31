'use strict';

var path = require('path');
var resolveCwd = require('./resolveCwd');
var fs = require('fs-extra');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var getWebpackCommonConfig = require('./getWebpackCommonConfig');
var assign = require('object-assign');

function getEntry() {
  var exampleDir = resolveCwd('examples');
  var files = fs.readdirSync(exampleDir);
  var entry = {};
  files.forEach((file) => {
    var extname = path.extname(file);
    var name = path.basename(file, extname);
    if (extname === '.js' || extname === '.jsx' || extname === '.tsx' || extname === '.ts') {
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
  if (!dev) {
    // dev mode error
    plugins.push(new webpack.optimize.DedupePlugin());
  }
  plugins.push(new ExtractTextPlugin('[name].css', {
    disable: false,
    allChunks: true,
  }));
  plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV)
    }
  }));
  if (!dev) {
    plugins.push(new webpack.optimize.CommonsChunkPlugin('common', 'common.js'));
  }
  return assign({
    devtool: dev ? '#inline-source-map' : '#source-map',

    resolveLoader: getWebpackCommonConfig.getResolveLoader(),

    entry: getEntry(),

    output: {
      path: resolveCwd('build', 'examples'),
      filename: '[name].js',
    },

    module: {
      noParse: [/moment.js/],
      loaders: getWebpackCommonConfig.getLoaders()
        .concat(getWebpackCommonConfig.getCssLoaders(true)),
    },

    resolve: getWebpackCommonConfig.getResolve(),

    plugins,
  }, getWebpackCommonConfig.getLoaderConfig());
};
