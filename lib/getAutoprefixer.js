'use strict';

const autoprefixer = require('autoprefixer');

module.exports = function() {
  return autoprefixer({
    remove: false,
  });
};
