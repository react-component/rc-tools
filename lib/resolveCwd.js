'use strict';

var path = require('path');

module.exports = function resolveCwd() {
  var args = [].slice.call(arguments, 0);
  args.unshift(process.cwd());
  return path.join.apply(path, args);
};
