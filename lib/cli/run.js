#!/usr/bin/env node

require('colorful').colorful();

var program = require('commander');

program.on('--help', () => {
  console.log('  Usage:'.to.bold.blue.color);
  console.log();
  console.log('    $', 'rc-tools run lint'.to.magenta.color, 'lint source within lib');
  console.log('    $', 'rc-tools run pub'.to.magenta.color, 'publish component');
  console.log('    $', 'rc-tools run server'.to.magenta.color, 'start server');
  console.log('    $', 'rc-tools run chrome-test'.to.magenta.color, 'run chrome tests');
  console.log('    $', 'rc-tools run macaca-test'.to.magenta.color, 'run ui tests');
  console.log();
});

program.parse(process.argv);

var task = program.args[0];

if (!task) {
  program.help();
} else if (task === 'server') {
  var port = process.env.npm_package_config_port || 8000;
  console.log(`listen at ${port}`);
  var app = require('../server/')();
  app.listen(port);
} else {
  console.log('rc-tools run', task);
  var gulp = require('gulp');
  require('../gulpfile');
  gulp.start(task);
}
