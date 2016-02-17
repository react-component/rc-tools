'use strict';

var getKarmaConfig = require('./getKarmaConfig');

module.exports = function conf(config) {
  config.set(getKarmaConfig('test', {
    browsers: ['PhantomJS'],
    singleRun: true,
    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered
      // (useful if karma exits without killing phantom)
      exitOnResourceError: true,
    },
  }));
};
