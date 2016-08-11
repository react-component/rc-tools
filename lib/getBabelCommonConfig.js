'use strict';

const argv = require('minimist')(process.argv.slice(2));
const plugins = [require.resolve('babel-plugin-add-module-exports')];

if (argv['babel-runtime']) {
  plugins.push([require.resolve('babel-plugin-transform-runtime'), {
    polyfill: false,
  }]);
}

module.exports = function () {
  return {
    presets: ['es2015-ie', 'react', 'stage-0'].map((name) => {
      return require.resolve(`babel-preset-${name}`);
    }),
    plugins,
  };
};
