#!/usr/bin/env node

require('colorful').colorful();

var program = require('commander');
var packageInfo = require('../package.json');

program
  .version(packageInfo.version)
  .command('run [name]', 'run specified task')
  .parse(process.argv);

var subCmd = program.args[0];

if (!subCmd || subCmd !== 'run') {
  program.help();
}

