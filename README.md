# rc-tools

offline tools for react component

[![NPM version][npm-image]][npm-url]
[![gemnasium deps][gemnasium-image]][gemnasium-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![david-dm][david-image]][david-url]

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
[david-image]: https://david-dm.org/react-component/rc-tools.svg
[david-url]: https://david-dm.org/react-component/rc-tools

## Usage

```
$ rc-tools run lint: run lint by https://github.com/airbnb/javascript
$ rc-tools run pub: compile and npm publish
$ rc-tools run watch --out-dir=/xx: watch and compile to /xx, default to lib
$ rc-tools run build: build examples
$ rc-tools run gh-pages: push example to gh-pages
$ rc-tools run start: start dev server
```


package.json demo

```js
({
  config: {
    entry:{}, // webpack entry for build dist umd
    port: 8000, // dev server port
    output:{}, // webpack output for build dist umd
  }
})
```

## History

### 9.0.0

- upgrade all deps
- add `test` task

### 8.0.0

- upgrade eslint to the latest version
- introduce prettier

### 7.0.0

- upgrade to webpack3

### 6.0.0

- move test to rc-test
