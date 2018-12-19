'use strict';

const path = require('path');
const resolveCwd = require('./resolveCwd');
const fs = require('fs-extra');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const getWebpackCommonConfig = require('./getWebpackCommonConfig');

function getEntry() {
  const exampleDir = resolveCwd('examples');
  const files = fs.readdirSync(exampleDir);
  const entry = {};
  files.forEach(file => {
    const extname = path.extname(file);
    const name = path.basename(file, extname);
    if (extname === '.js' || extname === '.jsx' || extname === '.tsx' || extname === '.ts') {
      const htmlFile = path.join(exampleDir, `${name}.html`);
      if (fs.existsSync(htmlFile)) {
        entry[`examples/${name}`] = [`./examples/${file}`];
      }
    }
  });
  return entry;
}

const ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = ({ common, inlineSourceMap, prod }) => {
  const plugins = [new ProgressBarPlugin()];
  plugins.push(
    new MiniCssExtractPlugin(),
  );
  if (common) {
    plugins.push(
      new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        filename: 'common.js',
      })
    );
  }
  return {
    mode: prod ? 'production' : 'development', 
    devtool: inlineSourceMap ? '#inline-source-map' : '#source-map',

    resolveLoader: getWebpackCommonConfig.getResolveLoader(),

    entry: getEntry(),

    output: {
      path: resolveCwd('build'),
      filename: '[name].js',
    },

    module: {
      noParse: [/moment.js/],
      rules: getWebpackCommonConfig.getLoaders().concat(getWebpackCommonConfig.getCssLoaders(true)),
    },

    resolve: getWebpackCommonConfig.getResolve(),

    plugins,
  };
};
