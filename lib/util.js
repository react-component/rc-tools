var path = require('path');
var cwd = process.cwd();
var fs = require('fs-extra');
var serverFn = path.join(cwd, 'server-fn.js');
var serverExists = fs.existsSync(serverFn);

function startServer(cb) {
  var app;
  if (serverExists) {
    app = require(serverFn)();
  } else {
    app = require('rc-server')();
  }
  app.listen(function listen() {
    var port = this.address().port;
    console.log('start server at port:', port);
    cb.call(this, port);
  });
}

function runCmd(cmd, args, fn) {
  args = args || [];
  var runner = require('child_process').spawn(cmd, args, {
    // keep color
    stdio: 'inherit',
  });
  runner.on('close', function close(code) {
    if (fn) {
      fn(code);
    }
  });
}

module.exports = {
  runCmd: runCmd,
  startServer: startServer,
};
