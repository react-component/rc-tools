var cwd = process.cwd();
var path = require('path');
var pkg = require(path.join(cwd, 'package.json'));
var matchRequire = require('match-require');
var glob = require('glob');
var fs = require('fs');

function startsWith(str, prefix) {
  return str.slice(0, prefix.length) === prefix;
}

function check(done) {
  glob('src/**/*.@(js|jsx)', {}, function (err, files) {
    var errors = [];
    var codeDeps = {};
    files.forEach(function (p) {
      var file = path.join(cwd, p);
      var content = fs.readFileSync(file, 'utf-8');
      var deps = matchRequire.findAll(content);
      deps = deps.filter(function (dep) {
        return dep && !startsWith(dep, './') && !startsWith(dep, '../');
      });
      deps = deps.map(function (dep) {
        return dep.split('/')[0];
      });
      deps.forEach(function (d) {
        codeDeps[d] = 1;
      });
    });

    var pkgDeps = pkg.dependencies || {};

    var miss = [];
    var redundant = [];

    Object.keys(codeDeps).forEach(function (td) {
      if (!pkgDeps[td] && td !== 'react' && td !== 'react/addons') {
        miss.push(td);
      }
    });

    Object.keys(pkgDeps).forEach(function (rd) {
      if (!codeDeps[rd]) {
        redundant.push(rd);
      }
    });

    if (miss.length) {
      errors.push('missing dependency: ' + miss.join(';'));
    }

    if (redundant.length) {
      errors.push('redundant dependency: ' + redundant.join(';'));
    }

    done(errors.length ? errors : null);
  });
}


module.exports = check;
