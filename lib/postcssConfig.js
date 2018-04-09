'use strict';

const autoprefixer = require('./getAutoprefixer')();

module.exports = function() {
  return [autoprefixer];
};
