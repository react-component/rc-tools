'use strict';

var cwd = process.cwd();
var path = require('path');
var NODE_MODULES = 'node_modules';
var utils = require('modulex-util');
var packages = {
  es5Shim: 1,
  normalize: 'normalize.css',
  consolePolyfill: 1,
  mocha: 1,
  'highlight.js': 1,
};

function deCamelCase(m) {
  return `-${m.toLowerCase()}`;
}

function findPackage(packageName) {
  var file = require.resolve(packageName);
  var dir = path.dirname(file);
  var lastDir = dir;
  while (dir !== '/' && !utils.endsWith(dir, NODE_MODULES)) {
    lastDir = dir;
    dir = path.resolve(dir, '../');
  }
  var url = path.relative(cwd, lastDir);
  if (!utils.startsWith(url, NODE_MODULES)) {
    url = path.join(NODE_MODULES, url);
  }
  return url;
}

for (var p in packages) {
  if (packages.hasOwnProperty(p)) {
    var name = p;
    if (typeof packages[p] === 'string') {
      name = packages[p];
    } else {
      name = name.replace(/[A-Z]/g, deCamelCase);
    }
    packages[p] = findPackage(name);
  }
}

packages.highlightJs = packages['highlight.js'];

module.exports = {
  findPackage,

  getPackages() {
    return packages;
  },
};
