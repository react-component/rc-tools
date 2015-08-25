var getCommonKarmaConf = require('./getCommonKarmaConf');
var assign = require('object-assign');

var customLaunchers = {
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7',
  },
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
  },
  sl_safari: {
    base: 'SauceLabs',
    platform: 'OS X 10.11',
    browserName: 'safari',
  },
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11',
  },
  sl_ie_10: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    version: '10',
  },
  sl_ie_9: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    version: '9',
  },
  sl_ie_8: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    version: '8',
  },
};

module.exports = function conf(config) {
  config.set(assign({}, getCommonKarmaConf(), {
    sauceLabs: {
      testName: 'Cross Browser Test',
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: ['dots', 'saucelabs'],
    singleRun: true,
  }));
};
