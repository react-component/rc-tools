'use strict';

const argv = require('minimist')(process.argv.slice(2));
const plugins = ['add-module-exports'];

if (argv['babel-runtime']) {
  plugins.push(['transform-runtime', {
    polyfill: false,
  }]);
}

module.exports = function () {
  return {
    presets: ['es2015-ie', 'react', 'stage-0'].map((name) => {
      return require.resolve(`babel-preset-${name}`);
    }),
    plugins: plugins.map((name) => {
      if (Array.isArray(name)) {
        return [
          require.resolve(`babel-plugin-${name[0]}`),
          name[1],
        ];
      }
      return require.resolve(`babel-plugin-${name}`);
    }),
  };
};
