var transform = require('es3ify').transform;

module.exports = function(code) {
  this.cacheable();
  return transform(code);
};
