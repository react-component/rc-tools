'use strict';

const path = require('path');
const resolveCwd = require('./resolveCwd');
const cwd = process.cwd();
const pkg = require(resolveCwd('package.json'));
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const getBabelCommonConfig = require('./getBabelCommonConfig');
const tsConfig = require('./getTSCommonConfig')();
const constants = require('./constants');

delete tsConfig.noExternalResolve;

tsConfig.declaration = false;

function getResolve() {
  const alias = {};
  const resolve = {
    root: cwd,
    extensions: ['', '.web.ts', '.web.tsx', '.web.js', '.web.jsx', '.ts', '.tsx', '.js', '.jsx'],
    alias,
  };
  const name = pkg.name;
  alias[`${name}$`] = resolveCwd('index.js');
  alias[`${name}/${constants.tsCompiledDir}`] = cwd;
  alias[name] = cwd;
  return resolve;
}


module.exports = {
  getResolve,
  getResolveLoader() {
    return {
      root: path.join(__dirname, '../node_modules'),
    };
  },
  getLoaders() {
    return [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel'],
      },
      {
        test: /\.svg$/,
        loader: 'svg-sprite',
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loaders: ['babel', 'ts'],
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
      // loads bootstrap's css.
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff',
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff',
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/octet-stream',
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file',
      },
      {
        test: /\.(png|jpg|jpeg|webp)$/i,
        loader: 'file',
      },
    ];
  },
  getLoaderConfig() {
    return {
      babel: getBabelCommonConfig(),
      ts: {
        transpileOnly: true,
        compilerOptions: tsConfig,
      },
      postcss: require('./postcssConfig')(),
    };
  },
  getCssLoaders(extractCss) {
    let cssLoader = ('css?sourceMap!postcss-loader');
    let lessLoader = ('css?sourceMap!postcss-loader!less?sourceMap');
    if (extractCss) {
      cssLoader = ExtractTextPlugin.extract(cssLoader);
      lessLoader = ExtractTextPlugin.extract(lessLoader);
    } else {
      cssLoader = `style!${cssLoader}`;
      lessLoader = `style!${lessLoader}`;
    }
    return [
      {
        test: /\.css$/,
        loader: cssLoader,
      },
      {
        test: /\.less$/,
        loader: lessLoader,
      },
    ];
  },
};
