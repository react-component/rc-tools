require('colorful').colorful();

var program = require('commander');
var packageInfo = require('../package.json');

program
  .version(packageInfo.version)
  .command('run [name]', 'run specified task')
  .parse(process.argv);

// https://github.com/tj/commander.js/pull/260
var proc = program.runningCommand;
if (proc) {
  proc.on('close', process.exit.bind(process));
  proc.on('error', function () {
    process.exit(1);
  });
}

var subCmd = program.args[0];
if (!subCmd || subCmd !== 'run') {
  program.help();
}

