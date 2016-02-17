'use strict';

var getKarmaConfig = require('./getKarmaConfig');

module.exports = function conf(config) {
  var browsers = ['Chrome'];
  config.set(getKarmaConfig('chrome-test', {
    browsers,
  }));
};
