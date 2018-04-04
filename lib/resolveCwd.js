'use strict';

const path = require('path');

module.exports = function resolveCwd(...args) {
  args.unshift(process.cwd());
  return path.join(...args);
};
