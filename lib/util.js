'use strict';

const chalk = require('chalk');

function runCmd(cmd, args, fn) {
  args = args || [];
  const runner = require('child_process').spawn(cmd, args, {
    // keep color
    stdio: 'inherit',
  });
  runner.on('close', code => {
    if (fn) {
      if (code) {
        console.log(chalk.yellow(`Error on execution: ${cmd} ${(args || []).join(' ')}`));
      }
      fn(code);
    }
  });
}

function getNpmArgs() {
  let npmArgv = null;

  try {
    npmArgv = JSON.parse(process.env.npm_config_argv);
  } catch (err) {
    return null;
  }

  if (typeof npmArgv !== 'object' || !npmArgv.cooked || !Array.isArray(npmArgv.cooked)) {
    return null;
  }

  return npmArgv.cooked;
}

module.exports = {
  runCmd,
  getNpmArgs,
};
