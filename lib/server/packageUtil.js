'use strict';

var cwd = process.cwd();
var path = require('path');
var NODE_MODULES = 'node_modules';
var utils = require('modulex-util');
var packages = {
  es5Shim: 1,
  es6Shim: 1,
  es6Promise: 1,
  normalize: 'normalize.css',
  consolePolyfill: 1,
  mocha: 1,
  'highlight.js': 1,
  fastclick: 1,
};

function deCamelCase(m) {
  return `-${m.toLowerCase()}`;
}

function findPackage(packageName) {
  try {
    var file = require.resolve(packageName);
    var dir = path.dirname(file);
    var url = path.relative(cwd, dir);
    if (url.indexOf('/rc-tools/') !== -1) {
      const index = url.indexOf('/rc-tools/');
      return path.join(NODE_MODULES, url.substring(index));
    }

    if (!utils.startsWith(url, NODE_MODULES)) {
      url = path.join(NODE_MODULES, url);
    }
    return url;
  } catch (e) {
    return null;
  }
}

for (var p in packages) {
  if (packages.hasOwnProperty(p)) {
    var name = p;
    if (typeof packages[p] === 'string') {
      name = packages[p];
    } else {
      name = name.replace(/[A-Z]/g, deCamelCase);
    }
    packages[p] = findPackage(`${name}/package.json`);
  }
}

packages.highlightJs = packages['highlight.js'];

packages.public = findPackage(`../../public/modernizr.js`);

module.exports = {
  findPackage,

  getPackages() {
    return packages;
  },
};
