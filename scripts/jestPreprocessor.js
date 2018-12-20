const path = require('path');
const { createTransformer: babelTransFormer } = require('babel-jest');
const { createTransformer: tsTransFormer } = require('ts-jest');
const getBabelCommonConfig = require('../lib/getBabelCommonConfig');

const tsJest = tsTransFormer({
  tsConfig: path.join(__dirname, '../lib/tests/tsconfig.test.json'),
});
const babelJest = babelTransFormer(getBabelCommonConfig());

module.exports = {
  process(src, filePath) {
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isJavaScript = filePath.endsWith('.js') || filePath.endsWith('.jsx');

    if (isTypeScript) {
      src = tsJest.process(src, filePath, { moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'] });
    } else if (isJavaScript) {
      src = babelJest.process(src, filePath, { moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'] });
    } else {
      throw new Error(`File not match type: ${filePath}`);
    }

    return src;
  },
};
