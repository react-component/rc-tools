var assign = require('object-assign');
var getKarmaCommonConfig = require('./getKarmaCommonConfig');

module.exports = function conf(config) {
  var browsers = ['Chrome'];
  config.set(assign({}, getKarmaCommonConfig(), {
    browsers: browsers,
  }));
};
