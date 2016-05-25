'use strict';

module.exports = function () {
  return {
    target: 'es6',
    jsx: 'react',
    moduleResolution: 'node',
    declaration: true,
    noExternalResolve: true,
  };
};
