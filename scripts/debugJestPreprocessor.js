const preProcessor = require('./jestPreprocessor');

module.exports = {
  ...preProcessor,
  process(...args) {
    const filePath = args[1];
    console.log('process:', filePath);
    return preProcessor.process(...args);
  },
};
