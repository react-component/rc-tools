'use strict';

const argv = require('minimist')(process.argv.slice(2));


module.exports = function (modules) {
  const plugins = [
    require.resolve('babel-plugin-transform-es3-member-expression-literals'),
    require.resolve('babel-plugin-transform-es3-property-literals'),
  ];
  if (modules !== false) {
    plugins.push(require.resolve('babel-plugin-add-module-exports'));
  }
  if (argv['babel-runtime']) {
    plugins.push([require.resolve('babel-plugin-transform-runtime'), {
      polyfill: false,
    }]);
  }
  return {
    presets: [[require.resolve(`babel-preset-es2015`), {
      modules,
    }]].concat(['react', 'stage-0'].map((name) => {
      return require(`babel-preset-${name}`);
    })),
    plugins,
  };
};
