var assign = require('object-assign');
var getCommonKarmaConf = require('./getCommonKarmaConf');

module.exports = function conf(config) {
  var browsers = ['Chrome', 'Firefox', 'Safari'];
  if (process.platform === 'win32') {
    browsers.push('IE');
  }
  config.set(assign({}, getCommonKarmaConf(), {
    browsers: browsers,
    frameworks: ['mocha'],
    reporters: ['dots'],
  }));
};
