# rc-tools

offline tools for react component

[![NPM version][npm-image]][npm-url]
[![gemnasium deps][gemnasium-image]][gemnasium-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/rc-tools.svg?style=flat-square
[npm-url]: http://npmjs.org/package/rc-tools
[travis-image]: https://img.shields.io/travis/react-component/rc-tools.svg?style=flat-square
[travis-url]: https://travis-ci.org/react-component/rc-tools
[coveralls-image]: https://img.shields.io/coveralls/react-component/rc-tools.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/react-component/rc-tools?branch=master
[gemnasium-image]: http://img.shields.io/gemnasium/react-component/rc-tools.svg?style=flat-square
[gemnasium-url]: https://gemnasium.com/react-component/rc-tools
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/rc-tools.svg?style=flat-square
[download-url]: https://npmjs.org/package/rc-tools

## Usage

```
$ rc-tools run lint: run lint by https://github.com/airbnb/javascript
$ rc-tools run pub: compile and npm publish
$ rc-tools run watch --out-dir=/xx: watch and compile to /xx, default to lib
$ rc-tools run build: build examples
$ rc-tools run gh-pages: push example to gh-pages
$ rc-tools run start: start dev server
$ rc-tools run karma: run karma tests
$ rc-tools run karma --single-run: run karma tests single run
$ rc-tools run saucelabs: run saucelabs tests
$ rc-tools run chrome-test: run browser-test in chrome
$ rc-tools run test: run test in phantomjs
$ rc-tools run coverage: run test coverage in phantomjs
$ rc-tools run macaca-test: run ui test in macaca-electron
```
