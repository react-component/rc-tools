var path = require('path');
var cwd = process.cwd();
var fs = require('fs-extra');
var webpack = require('webpack');
var pkg = require(path.join(cwd, 'package.json'));
var ExtractTextPlugin = require('extract-text-webpack-plugin');

function getResolve() {
  var alias = {};
  var resolve = {
    root: cwd,
    extensions: ['', '.js', '.jsx'],
    alias: alias
  };
  var name = pkg.name;
  alias[name + '$'] = path.join(cwd, 'index.js');
  alias[name] = cwd;
  return resolve;
}

function getEntry() {
  var exampleDir = path.join(cwd, 'examples');
  var files = fs.readdirSync(exampleDir);
  var entry = {};
  files.forEach(function (f) {
    var extname = path.extname(f);
    var name = path.basename(f, extname);
    if (extname === '.js' || extname === '.jsx') {
      var htmlFile = path.join(exampleDir, name + '.html');
      if (fs.existsSync(htmlFile)) {
        entry[name] = ['./examples/' + f];
      }
    }
  });
  return entry;
}

module.exports = function () {
  return {
    devtool: '#source-map',

    resolveLoader: {
      root: path.join(__dirname, '../node_modules')
    },

    entry: getEntry(),

    output: {
      path: path.join(cwd, 'build', 'examples'),
      filename: '[name].js'
    },

    module: {
      loaders: [
        {
          test: /\.jsx$/,
          exclude: /node_modules/,
          loader: 'babel'
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel'
        },
        {test: /\.json$/, loader: 'json-loader'},
        {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract('css?sourceMap&-minimize!' + 'autoprefixer-loader!' + 'less?sourceMap')
        }, {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('css?sourceMap&-minimize!' + 'autoprefixer-loader')
        },
        // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
        // loads bootstrap's css.
        {test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/font-woff'},
        {test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/font-woff'},
        {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/octet-stream'},
        {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file'},
        {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=image/svg+xml'}
      ]
    },

    resolve: getResolve(),

    externals: {
      react: 'React'
    },

    plugins: [
      new ExtractTextPlugin('[name].css'),
      // ./robot is automatically detected as common module and extracted
      new webpack.optimize.CommonsChunkPlugin('common.js')
    ]
  };
};
