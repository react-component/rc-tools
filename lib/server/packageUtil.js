'use strict';

const path = require('path');
const utils = require('modulex-util');

const cwd = process.cwd();
const NODE_MODULES = 'node_modules';
const packages = {
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
    const file = require.resolve(packageName);
    const dir = path.dirname(file);
    let url = path.relative(cwd, dir);
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

Object.keys(packages).forEach(p => {
  let name = p;
  if (typeof packages[p] === 'string') {
    name = packages[p];
  } else {
    name = name.replace(/[A-Z]/g, deCamelCase);
  }
  packages[p] = findPackage(`${name}/package.json`);
});

packages.highlightJs = packages['highlight.js'];

packages.public = findPackage(`../../public/modernizr.js`);

module.exports = {
  findPackage,

  getPackages() {
    return packages;
  },
};
