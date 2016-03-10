'use strict';

module.exports = function () {
  return {
    presets: ['es2015', 'react', 'stage-0'].map((name) => {
      return require(`babel-preset-${name}`);
    }),
    plugins: ['add-module-exports'].map((name) => {
      return require(`babel-plugin-${name}`);
    }),
  };
};
