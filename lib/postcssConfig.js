'use strict';

const autoprefixer = require('./getAutoPrefixer')();

module.exports = function () {
  return [autoprefixer];
};
