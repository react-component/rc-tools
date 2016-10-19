'use strict';

module.exports = function () {
  return {
    strictNullChecks: true,
    target: 'es6',
    jsx: 'preserve',
    moduleResolution: 'node',
    allowSyntheticDefaultImports: true,
    declaration: true,
    sourceMap: true,
  };
};
