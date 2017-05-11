const typescript = require('typescript');
const { createTransformer } = require('babel-jest');
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
      const fileName = isJavaScript ? path : 'file.js';

      src = babelJest.process(src, fileName);
    }

    return src;
  },
};
