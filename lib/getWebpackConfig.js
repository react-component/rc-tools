var path = require('path');
var cwd = process.cwd();
var fs = require('fs-extra');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var getWebpackCommon = require('./getWebpackCommon');

function getEntry() {
  var exampleDir = path.join(cwd, 'examples');
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
  return {
    devtool: '#source-map',

    resolveLoader: getWebpackCommon.getResolveLoader(),

    entry: getEntry(),

    output: {
      path: path.join(cwd, 'build', 'examples'),
      filename: '[name].js',
    },

    module: {
      loaders: getWebpackCommon.getLoaders().concat(getWebpackCommon.getCssLoaders(true)),
    },

    resolve: getWebpackCommon.getResolve(),

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
