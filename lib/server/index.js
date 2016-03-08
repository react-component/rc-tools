'use strict';

var serve = require('koa-static');
var cwd = process.cwd();
var path = require('path');
var webpackMiddleware = require('koa-webpack-dev-middleware');
var getWebpackConfig = require('../getWebpackConfig');
var serveIndex = require('koa-serve-index');
var koaBody = require('koa-body');
var router = require('koa-router');
var webpack = require('webpack');
var chalk = require('chalk');

require('xtpl').config({
  XTemplate: require('xtemplate'),
});

module.exports = function (app) {
  app = app || require('koa')();
  app = require('xtpl/lib/koa')(app, {
    views: path.join(__dirname, '../../views'),
  });
  var root = cwd;
  app.use(require('koa-favicon')(path.join(__dirname, '../../public/favicon.ico')));
  // parse application/x-www-form-urlencoded
  app.use(koaBody());
  app.use(router(app));
  app.use(require('./js2html')());
  var webpackConfig = getWebpackConfig(true);
  webpackConfig.plugins.push(
    new webpack.ProgressPlugin((percentage, msg) => {
      const stream = process.stderr;
      if (stream.isTTY && percentage < 0.71) {
        stream.cursorTo(0);
        stream.write(chalk.magenta(msg));
        stream.clearLine(1);
      } else if (percentage === 1) {
        console.log(chalk.green('\nwebpack: bundle build is now finished.'));
      }
    })
  );
  var compiler = webpack(webpackConfig);
  compiler.plugin('done', (stats) => {
    if (stats.hasErrors()) {
      console.log(stats.toString({
        colors: true,
      }));
    }
  });
  app.use(webpackMiddleware(compiler));
  app.use(serveIndex(root, {
    hidden: true,
    view: 'details',
  }));
  app.use(serve(root, {
    hidden: true,
  }));
  return app;
};
