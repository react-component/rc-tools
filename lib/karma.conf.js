'use strict';

var assign = require('object-assign');
var getKarmaCommonConfig = require('./getKarmaCommonConfig');

module.exports = function conf(config) {
  var browsers = ['Chrome', 'Firefox', 'Safari'];
  if (process.platform === 'win32') {
    browsers.push('IE');
  }
  config.set(assign({}, getKarmaCommonConfig(), {
    browsers,
  }));
};
