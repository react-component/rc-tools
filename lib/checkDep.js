var cwd = process.cwd();
var path = require('path');
var pkg = require(path.join(cwd, 'package.json'));
var matchRequire = require('match-require');
var glob = require('glob');
var fs = require('fs');

function check(done, dir) {
  dir = dir || 'src';
  glob(dir + '/**/*.@(js|jsx)', {}, function (err, files) {
    var errors = [];
    var codeDeps = {};
    files.forEach(function (file) {
      file = path.join(cwd, file);
      var content = fs.readFileSync(file, 'utf-8');
      var deps = matchRequire.findAll(content);
      if (!deps.length) {
        deps = matchRequire.findAllImports(content);
      }
      deps = deps.filter(function (dep) {
        return !matchRequire.isRelativeModule(dep);
      });
      deps = deps.map(function (dep) {
        return matchRequire.splitPackageName(dep).packageName;
      });
      deps.forEach(function (dep) {
        codeDeps[dep] = 1;
      });
    });

    var pkgDeps = pkg.dependencies || {};

    var miss = [];
    var redundant = [];

    Object.keys(codeDeps).forEach(function (td) {
      if (!pkgDeps[td] && td !== 'react' && td !== 'react/addons' && td !== 'react-dom' && td !== pkg.name) {
        miss.push(td);
      }
    });

    Object.keys(pkgDeps).forEach(function (rd) {
      if (!codeDeps[rd]) {
        redundant.push(rd);
      }
    });

    if (miss.length) {
      errors.push('missing dependency in dependencies of package.json: ' + miss.join(';'));
    }

    if (redundant.length) {
      errors.push('redundant dependency in dependencies of package.json: ' + redundant.join(';'));
    }

    done(errors.length ? errors : null);
  });
}


module.exports = check;
