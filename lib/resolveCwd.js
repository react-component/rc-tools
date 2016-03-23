'use strict';

/* eslint prefer-rest-params:0 */

var path = require('path');

module.exports = function resolveCwd() {
  const args = [].slice.call(arguments, 0);
  args.unshift(process.cwd());
  return path.join.apply(path, args);
};
