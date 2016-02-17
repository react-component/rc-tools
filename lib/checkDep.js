'use strict';

var resolveCwd = require('./resolveCwd');
var pkg = require(resolveCwd('package.json'));
var matchRequire = require('match-require');
var glob = require('glob');
var fs = require('fs');

function check(done, dir) {
  dir = dir || 'src';
  glob(`${dir}/**/*.@(js|jsx)`, {}, (err, files) => {
    var errors = [];
    var codeDeps = {};
    files.forEach((file) => {
      file = resolveCwd(file);
      var content = fs.readFileSync(file, 'utf-8');
      var deps = matchRequire.findAll(content);
      if (!deps.length) {
        deps = matchRequire.findAllImports(content);
      }
      deps = deps.filter((dep) => {
        return !matchRequire.isRelativeModule(dep);
      });
      deps = deps.map((dep) => {
        return matchRequire.splitPackageName(dep).packageName;
      });
      deps.forEach((dep) => {
        codeDeps[dep] = 1;
      });
    });

    var pkgDeps = pkg.dependencies || {};

    var miss = [];
    var redundant = [];

    Object.keys(codeDeps).forEach((td) => {
      if (!pkgDeps[td] && td !== 'react' &&
        td !== 'react/addons' &&
        td !== 'react-dom' && td !== pkg.name) {
        miss.push(td);
      }
    });

    Object.keys(pkgDeps).forEach((rd) => {
      if (!codeDeps[rd]) {
        redundant.push(rd);
      }
    });

    if (miss.length) {
      errors.push(`missing dependency in dependencies of package.json: ${miss.join(';')}`);
    }

    if (redundant.length) {
      errors.push(`redundant dependency in dependencies of package.json: ${redundant.join(';')}`);
    }

    done(errors.length ? errors : null);
  });
}


module.exports = check;
