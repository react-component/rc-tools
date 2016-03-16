'use strict';

var through = require('through2');
var transform = require('es3ify').transform;

module.exports = function gulpEs3ify() {
  return through.obj(function processFile(file, encoding, callback) {
    if (!file.isNull()) {
      file.contents = new Buffer(transform(file.contents.toString()));
    }
    this.push(file);
    callback();
  });
};
