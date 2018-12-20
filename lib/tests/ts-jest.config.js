const path = require('path');

const cwd = process.cwd();

// function projPath(...args) {
//   return path.join(cwd, ...args);
// }

function toolPath(...args) {
  return path.join(__dirname, '..', ...args);
}

const transformPath = toolPath('../scripts/jestPreprocessor.js');

function getTransform(name) {
  let path = require.resolve(name);
  const lastIndex = path.lastIndexOf(name);
  path = path.slice(0, lastIndex + name.length);
  return path;
}

console.log('ts-jest:', getTransform('ts-jest'));
console.log('babel-jest:', getTransform('babel-jest'));

module.exports = {
  verbose: true,
  rootDir: cwd,
  setupFiles: [
    toolPath('./tests/setup.js'), // tools setup
    './tests/setup.ts', // User setup
  ],
  testPathIgnorePatterns: ['/node_modules/', 'dekko', 'node'],
  modulePathIgnorePatterns: ['/examples/'],
  // preset: tsJestPath,
  moduleFileExtensions: [
    'js', 'jsx',
    'ts', 'tsx',
  ],
  
  testMatch: [
    '**/tests/**/*.spec.js?(x)',
    '**/tests/**/*.spec.ts?(x)',
  ],
  transform: {
    '\\.jsx?$': transformPath,
    '\\.tsx?$': transformPath,
  },
  // globals: {
  //   'ts-jest': {
  //     tsConfig: toolPath('./tests/tsconfig.test.json'),
  //   },
  // },
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  transformIgnorePatterns: [
    '/examples/',
    '/build/',
    'node_modules/[^/]+?/(?!(es|node_modules)/)'
  ],
  collectCoverageFrom: [
    '**/src/**.{js,jsx,ts,tsx}',
    "!**/node_modules/**",
  ],
};
