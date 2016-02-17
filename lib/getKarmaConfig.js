'use strict';

var fs = require('fs');
var assign = require('object-assign');
var resolveCwd = require('./resolveCwd');
var getKarmaCommonConfig = require('./getKarmaCommonConfig');
var userKarmaConfig;

if (fs.existsSync(resolveCwd('karma.conf.js'))) {
  userKarmaConfig = require(resolveCwd('karma.conf.js'));
}

module.exports = function (type, other) {
  var userConfig = assign({}, getKarmaCommonConfig(), other);
  if (userKarmaConfig && userKarmaConfig[type]) {
    userConfig = userKarmaConfig[type](userConfig);
  }
  return userConfig;
};
