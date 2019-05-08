const fs = require('fs');
const shelljs = require('shelljs');
const resolveCwd = require('../resolveCwd');

function cleanCompile() {
  try {
    if (fs.existsSync(resolveCwd('lib'))) {
      shelljs.rm('-rf', resolveCwd('lib'));
    }
    if (fs.existsSync(resolveCwd('es'))) {
      shelljs.rm('-rf', resolveCwd('es'));
    }
    if (fs.existsSync(resolveCwd('assets'))) {
      shelljs.rm('-rf', resolveCwd('assets/*.css'));
    }
  } catch (err) {
    console.log('Clean up failed:', err);
    throw err;
  }
}

function cleanBuild() {
  if (fs.existsSync(resolveCwd('build'))) {
    shelljs.rm('-rf', resolveCwd('build'));
  }
}

function clean() {
  cleanCompile();
  cleanBuild();
}

function registerTasks(gulp) {
  gulp.task(
    'clean',
    gulp.series(done => {
      clean();
      done();
    })
  );
  
  gulp.task(
    'cleanCompile',
    gulp.series(done => {
      cleanCompile();
      done();
    })
  );
  
  gulp.task(
    'cleanBuild',
    gulp.series(done => {
      cleanBuild();
      done();
    })
  );
}

registerTasks.cleanCompile = cleanCompile;
registerTasks.cleanBuild = cleanBuild;
registerTasks.clean = clean;

module.exports = registerTasks;
