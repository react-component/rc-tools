'use strict';

module.exports = function () {
  return {
    presets: ['es2015-ie', 'react', 'stage-0'].map((name) => {
      return require.resolve(`babel-preset-${name}`);
    }),
    plugins: ['add-module-exports'].map((name) => {
      return require.resolve(`babel-plugin-${name}`);
    }),
  };
};
