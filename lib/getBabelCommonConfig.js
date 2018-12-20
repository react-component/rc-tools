'use strict';

const argv = require('minimist')(process.argv.slice(2));

module.exports = function(modules) {
  const plugins = [
    require.resolve('@babel/plugin-transform-member-expression-literals'),
    require.resolve('@babel/plugin-transform-object-assign'),
    require.resolve('@babel/plugin-transform-property-literals'),
    require.resolve('@babel/plugin-transform-spread'),
    require.resolve('@babel/plugin-transform-template-literals'),
    require.resolve('@babel/plugin-proposal-export-default-from'),
    require.resolve('@babel/plugin-proposal-export-namespace-from'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    require.resolve('@babel/plugin-proposal-class-properties'),
  ];
  if (argv['babel-runtime']) {
    plugins.push([
      require.resolve('@babel/plugin-transform-runtime'),
      {
        helpers: false,
      },
    ]);
  }
  return {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          modules,
          exclude: ['transform-typeof-symbol'],
        },
      ],
      require.resolve(`@babel/preset-react`),
    ],
    plugins,
  };
};
