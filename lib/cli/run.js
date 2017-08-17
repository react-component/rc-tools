#!/usr/bin/env node

require('colorful').colorful();

var program = require('commander');
var exec = require('child_process').exec;

program.on('--help', () => {
  console.log('  Usage:'.to.bold.blue.color);
  console.log();
  console.log('    $', 'rc-tools run lint'.to.magenta.color, 'lint source within lib');
  console.log('    $', 'rc-tools run pub'.to.magenta.color, 'publish component');
  console.log('    $', 'rc-tools run server'.to.magenta.color, 'start server');
  console.log('    $', 'rc-tools run chrome-test'.to.magenta.color, 'run chrome tests');
  console.log();
});

program.parse(process.argv);

var task = program.args[0];

if (!task) {
  program.help();
} else if (task === 'server') {
  var port = process.env.npm_package_config_port || 8000;
  console.log(`Listening at http://localhost:${port}`);
  var app = require('../server/')();
  app.listen(port);
  if (process.env.DEMO_ENV === 'debugger') {
    console.log('start to lauch standalone react-devtools');
    var reactDevBin = require.resolve('react-devtools').replace('index.js', 'bin.js');
    exec(`node ${reactDevBin}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
  }
} else {
  console.log('rc-tools run', task);
  var gulp = require('gulp');
  require('../gulpfile');
  gulp.start(task);
}
