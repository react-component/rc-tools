'use strict';

const serve = require('koa-static');
const path = require('path');
const webpackMiddleware = require('koa-webpack-dev-middleware');
const Koa = require('koa');
const serveIndex = require('koa-serve-index');
const koaBody = require('koa-body');
const Router = require('koa-router');
const webpack = require('webpack');
const chalk = require('chalk');
const fs = require('fs');
const logger = require('koa-logger');
const getWebpackConfig = require('../getWebpackConfig');

require('xtpl').config({
  XTemplate: require('xtemplate'),
});

const cwd = process.cwd();

module.exports = function(app) {
  const router = new Router();

  app = app || new Koa();
  app = require('xtpl/lib/koa')(app, {
    views: path.join(__dirname, '../../views'),
  });
  const root = cwd;
  app.use(logger());
  app.use(
    require('koa-favicon')(path.join(__dirname, '../../public/favicon.ico'))
  );
  // parse application/x-www-form-urlencoded
  app.use(
    koaBody({
      formidable: { uploadDir: path.join(cwd, 'tmp') },
      multipart: true,
    })
  );

  app
    .use(router.routes())
    .use(router.allowedMethods());

  // app.use(router(app));
  app.use(require('./js2html')());
  let webpackConfig = getWebpackConfig({
    common: false,
    inlineSourceMap: true,
  });
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
  const publicPath = '/';
  if (fs.existsSync(path.join(cwd, 'webpack.config.js'))) {
    webpackConfig = require(path.join(cwd, 'webpack.config.js'))(webpackConfig);
  }

  const compiler = webpack(webpackConfig);
  compiler.plugin('done', stats => {
    if (stats.hasErrors()) {
      console.log(
        stats.toString({
          colors: true,
        })
      );
    }
  });
  app.use(
    webpackMiddleware(compiler, {
      publicPath,
      hot: true,
      https: false,
      quiet: true,
      headers: {
        'Cache-control': 'no-cache',
      },
    })
  );
  app.use(
    serveIndex(root, {
      hidden: true,
      view: 'details',
      icons: true,
      filter: filename => {
        return filename.indexOf('.') !== 0 && filename.indexOf('.js') < 0;
      },
    })
  );
  app.use(
    serve(root, {
      hidden: true,
    })
  );
  return app;
};
