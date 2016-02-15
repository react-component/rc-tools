'use strict';

var path = require('path');
var resolveCwd = require('./util').resolveCwd;
var cwd = process.cwd();
var pkg = require(resolveCwd('package.json'));
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var getBabelCommonConfig = require('./getBabelCommonConfig');

function getResolve() {
  var alias = {};
  var resolve = {
    root: cwd,
    extensions: ['', '.js', '.jsx'],
    alias,
  };
  var name = pkg.name;
  alias[`${name}$`] = resolveCwd('index.js');
  alias[name] = cwd;
  return resolve;
}


module.exports = () => {
  var ret = {
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
          loader: 'babel',
          query: getBabelCommonConfig(),
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
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url?limit=10000&minetype=image/svg+xml',
        },
      ];
    },
    getCssLoaders(extractCss) {
      var cssLoader = ('css?sourceMap!autoprefixer-loader');
      var lessLoader = ('css?sourceMap!autoprefixer-loader!less?sourceMap');
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
  return ret;
};
