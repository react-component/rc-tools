'use strict';

const path = require('path');
const resolveCwd = require('./resolveCwd');
const fs = require('fs-extra');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const getWebpackCommonConfig = require('./getWebpackCommonConfig');
const assign = require('object-assign');

function getEntry() {
  const exampleDir = resolveCwd('examples');
  const files = fs.readdirSync(exampleDir);
  const entry = {};
  files.forEach((file) => {
    const extname = path.extname(file);
    const name = path.basename(file, extname);
    if (extname === '.js' || extname === '.jsx' || extname === '.tsx' || extname === '.ts') {
      const htmlFile = path.join(exampleDir, `${name}.html`);
      if (fs.existsSync(htmlFile)) {
        entry[name] = [`./examples/${file}`];
      }
    }
  });
  return entry;
}

const ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = (dev) => {
  const plugins = [
    new ProgressBarPlugin(),
  ];
  plugins.push(new ExtractTextPlugin({
    filename: '[name].css',
    disable: false,
    allChunks: true,
  }));
  if (!dev) {
    plugins.push(new webpack.optimize.CommonsChunkPlugin('common', 'common.js'));
  }
  return {
    devtool: dev ? '#inline-source-map' : '#source-map',

    resolveLoader: getWebpackCommonConfig.getResolveLoader(),

    entry: getEntry(),

    output: {
      path: resolveCwd('build', 'examples'),
      filename: '[name].js',
    },

    module: {
      noParse: [/moment.js/],
      rules: getWebpackCommonConfig.getLoaders()
        .concat(getWebpackCommonConfig.getCssLoaders(true)),
    },

    resolve: getWebpackCommonConfig.getResolve(),

    plugins,
  };
};
