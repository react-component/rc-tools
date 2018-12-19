'use strict';

const path = require('path');
const resolveCwd = require('./resolveCwd');
const fs = require('fs-extra');
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
  console.log('>>>', entry);
  return entry;
}

const ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = ({ common, inlineSourceMap, prod }) => {
  const plugins = [new ProgressBarPlugin()];
  plugins.push(
    new MiniCssExtractPlugin(),
  );

  const config = {
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

  if (common) {
    config.optimization = {
      splitChunks: {
        cacheGroups: {
          commons: {
            name: 'common',
            chunks: 'initial',
            minChunks: 2,
          },
        },
      },
    };
  }

  return config;
};
