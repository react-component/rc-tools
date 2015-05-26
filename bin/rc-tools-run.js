#!/usr/bin/env node --harmony

require('colorful').colorful();

var program = require('commander');

program.on('--help', function () {
  console.log('  Usage:'.to.bold.blue.color);
  console.log();
  console.log('    $', 'rc-tools run lint'.to.magenta.color, 'lint source within lib');
  console.log('    $', 'rc-tools run less'.to.magenta.color, 'transform less files into css');
  console.log('    $', 'rc-tools run tag'.to.magenta.color, 'git tag current version');
  console.log('    $', 'rc-tools run history'.to.magenta.color, 'generate HISTORY.md');
  console.log('    $', 'rc-tools run saucelabs'.to.magenta.color, 'run saucelabs tests');
  console.log();
});

program.parse(process.argv);

var task = program.args[0];

if (!task) {
  program.help();
  return;
}

var gulp = require('gulp');
require('../lib/gulpfile');
gulp.start(task);
