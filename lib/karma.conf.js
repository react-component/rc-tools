'use strict';

var getKarmaConfig = require('./getKarmaConfig');

module.exports = function conf(config) {
  var browsers = ['Chrome', 'Firefox', 'Safari'];
  if (process.platform === 'win32') {
    browsers.push('IE');
  }
  config.set(getKarmaConfig('karma', {
    browsers,
  }));
};
