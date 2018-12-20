const typescript = require('typescript');
// const { createTransformer } = require('babel-jest');
const { createTransformer } = require('ts-jest');
const getBabelCommonConfig = require('../lib/getBabelCommonConfig');
const getTSCommonConfig = require('../lib/getTSCommonConfig');
const babelJest = createTransformer(getBabelCommonConfig());

module.exports = {
  process(src, path) {
    const isTypeScript = path.endsWith('.ts') || path.endsWith('.tsx');
    const isJavaScript = path.endsWith('.js') || path.endsWith('.jsx');

    if (isTypeScript) {
      src = typescript.transpile(src, getTSCommonConfig(), path, []);
    }

    if (isJavaScript || isTypeScript) {
      // src = babelJest.process(src, path, { moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'] });
      src = babelJest.process(src, path, { moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'] });
    }

    return src;
  },
};
