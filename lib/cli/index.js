#!/usr/bin/env node

'use strict';

require('colorful').colorful();

var program = require('commander');
var packageInfo = require('../../package.json');

program
  .version(packageInfo.version)
  .command('run [name]', 'run specified task')
  .parse(process.argv);

// https://github.com/tj/commander.js/pull/260
var proc = program.runningCommand;
if (proc) {
  proc.on('close', process.exit.bind(process));
  proc.on('error', () => {
    process.exit(1);
  });
}

process.on('SIGINT', () => {
  if (proc) {
    proc.kill('SIGKILL');
  }
  process.exit(0);
});

var subCmd = program.args[0];
if (!subCmd || subCmd !== 'run') {
  program.help();
}
