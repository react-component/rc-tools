var assign = require('object-assign');
var getKarmaCommonConfig = require('./getKarmaCommonConfig');

module.exports = function conf(config) {
  config.set(assign({}, getKarmaCommonConfig(), {
    browsers: ['PhantomJS'],
    singleRun: true,
    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom)
      exitOnResourceError: true,
    },
  }));
};
