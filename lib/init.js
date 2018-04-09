'use strict';

// from publish-please

const path = require('path');
const writeFile = require('fs').writeFileSync;
const chalk = require('chalk');

const pathJoin = path.join;

function reportNoConfig() {
  console.log(
    chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  );
  console.log(chalk.bgRed("!! Unable to setup rc-tools: project's package.json either missing !!"));
  console.log(chalk.bgRed('!! or malformed. Run `npm init` and then reinstall rc-tools.       !!'));
  console.log(
    chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  );
}

function reportCompletion() {
  console.log(chalk.bgGreen('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
  console.log(chalk.bgGreen('!! rc-tools was successfully installed for the project. !!'));
  console.log(chalk.bgGreen('!! Use `npm run pub` command for publishing.       !!'));
  console.log(chalk.bgGreen('!! publishing configuration.                                  !!'));
  console.log(chalk.bgGreen('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}

function addConfigHooks(cfg, projectDir) {
  if (!cfg.scripts) {
    cfg.scripts = {};
  }

  if (cfg.scripts.pub) {
    return false;
  }

  cfg.scripts = Object.assign(cfg.scripts, {
    build: 'rc-tools run build',
    'gh-pages': 'rc-tools run gh-pages',
    start: 'rc-tools run server',
    pub: 'rc-tools run update-self && rc-tools run pub',
    lint: 'rc-tools run lint',
  });

  if (cfg.scripts.prepublish) {
    cfg.scripts['pre-publish'] = cfg.scripts.prepublish;
  }

  cfg.scripts.prepublish = 'rc-tools run guard';

  writeFile(pathJoin(projectDir, 'package.json'), JSON.stringify(cfg, null, 2));

  return true;
}

function init() {
  const testMode = process.argv.indexOf('--test-mode') > -1;

  // NOTE: don't run on dev installation (running `npm install` in this repo)
  if (!testMode) {
    const { getNpmArgs } = require('./util');
    const npmArgs = getNpmArgs();

    if (!npmArgs || !npmArgs.some(arg => /^rc-tools(@\d+\.\d+.\d+)?$/.test(arg))) {
      return;
    }
  }
  // NOTE: <projectDir>/node_modules/rc-tools/lib
  const projectDir = pathJoin(__dirname, '../../../');

  const cfg = require(path.join(projectDir, 'package.json'));

  if (!cfg) {
    reportNoConfig();
    process.exit(1);
  } else if (addConfigHooks(cfg, projectDir)) {
    reportCompletion();
  }
}

init();
