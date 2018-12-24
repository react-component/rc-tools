'use strict';

const matchRequire = require('match-require');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const resolveCwd = require('./resolveCwd');

const pkg = require(resolveCwd('package.json'));

const ignoreMods = {
  path: 1,
  'react-native': 1,
  react: 1,
  'react-dom': 1,
  'react/addons': 1,
};

ignoreMods[pkg.name] = 1;

function check(done, dir) {
  dir = dir || 'src';
  glob(`${dir}/**/*.@(js|jsx|ts|tsx)`, {}, (err, files) => {
    const errors = [];
    const codeDeps = {};
    files.forEach(file => {
      file = resolveCwd(file);
      const extname = path.extname(file);
      if (extname === '.js' || extname === '.jsx') {
        const ts = file.replace(/\.jsx?$/, '.ts');
        const tsx = file.replace(/\.jsx?$/, '.tsx');
        if (fs.existsSync(ts) || fs.existsSync(tsx)) {
          return;
        }
      }
      const content = fs.readFileSync(file, 'utf-8');
      let deps = matchRequire.findAll(content);
      deps = deps.filter(dep => {
        return !matchRequire.isRelativeModule(dep);
      });
      deps = deps.map(dep => {
        return matchRequire.splitPackageName(dep).packageName;
      });
      deps.forEach(dep => {
        codeDeps[dep] = 1;
      });
    });

    const pkgDeps = pkg.dependencies || {};
    const peerDeps = pkg.peerDependencies || {};

    const miss = [];
    const redundant = [];

    Object.keys(codeDeps).forEach(td => {
      if (!pkgDeps[td] && !peerDeps[td] && !ignoreMods[td]) {
        miss.push(td);
      }
    });

    Object.keys(pkgDeps).forEach(rd => {
      if (!codeDeps[rd] && rd !== 'babel-runtime') {
        redundant.push(rd);
      }
    });

    if (miss.length) {
      errors.push(`missing dependency in dependencies of package.json: ${miss.join(';')}`);
    }

    if (redundant.length) {
      errors.push(`redundant dependency in dependencies of package.json: ${redundant.join(';')}`);
    }

    errors.forEach((msg) => {
      console.log(chalk.red(msg));
    });
    done(errors.length);
  });
}

module.exports = check;
