/**
 * Page related functions
 * - build
 * - gh-pages
 */

const jsx2example = require('gulp-jsx2example');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const chalk = require('chalk');
const webpack = require('webpack');
const storybook = require('@storybook/react/standalone');
const resolveCwd = require('../resolveCwd');
const genStorybook = require('../genStorybook');
const InitStoryConfigJs = require('../initStoryConfigJs');
const getWebpackConfig = require('../getWebpackConfig');

const projectPath = resolveCwd('./');
const pkg = require(resolveCwd('package.json'));

module.exports = function(gulp) {
  const { cleanBuild } = require('./cleanTasks');
  const { printResult } = require('./util');

  const isStorybook = !glob.sync('examples/*.html').length;

  // ====================== Webpack ======================
  function webpackJS() {
    return new Promise((resolve, reject) => {
      webpack(
        getWebpackConfig({
          common: true,
        }),
        (err, stats) => {
          if (err) {
            console.error('error', err);
          }
          printResult(stats);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  function webpackBuild(done) {
    console.log('[webpack] building...');
    if (!fs.existsSync(resolveCwd('./examples/'))) {
      console.log(chalk.red('😢 `examples` folder not exist. exit...'));
      done();
      return;
    }

    // Execute webpack
    webpackJS()
      .then(() => {
        // Merge files into build folder
        console.log('[webpack] Render HTML...');
        const dir = resolveCwd('./examples/');
        let files = fs.readdirSync(dir);
        files = files
          .filter((f) => f[0] !== '~') // Remove '~tmp' file
          .map((f) => path.join(dir, f));
        const filesMap = {};
        files.forEach((f) => {
          filesMap[f] = 1;
        });
        files.forEach((f) => {
          if (f.match(/\.tsx?$/)) {
            let js = f.replace(/\.tsx?$/, '.js');
            if (filesMap[js]) {
              delete filesMap[js];
            }
            js = f.replace(/\.tsx?$/, '.jsx');
            if (filesMap[js]) {
              delete filesMap[js];
            }
          }
        });
        gulp
          .src(Object.keys(filesMap))
          .pipe(
            jsx2example({
              dest: 'build/examples/',
            }),
          ) // jsx2example(options)
          .pipe(gulp.dest('build/examples/'))
          .on('finish', done);
      })
      .catch(done);
  }

  // ===================== Storybook =====================
  gulp.task('storybook', () => {
    // 生成 storybook 的配置文件
    genStorybook(projectPath);

    InitStoryConfigJs(projectPath, pkg);
    storybook({
      mode: 'dev',
      port: '9001',
      configDir: path.join(__dirname, '../storybook/'),
    });
  });

  function storybookBuild(done) {
    console.log('[storybook] building...');

    // 生成 storybook 的配置文件
    genStorybook(projectPath);

    InitStoryConfigJs(projectPath, pkg);

    storybook({
      mode: 'static',
      // 相对路径，storybook 会自动拼接 cmd 所在的位置
      outputDir: './build',
      configDir: path.join(__dirname, '../storybook/'),
    }).then(done);
  }

  gulp.task('storybook-build', (done) => {
    console.log(chalk.red('💩 `storybook-build` is removed. Use `build` directly!'));
    done('removed');
  });
  gulp.task('storybook-gh-pages', (done) => {
    console.log(chalk.red('💩 `storybook-gh-pages` is removed. Use `gh-pages` directly!'));
    done('removed');
  });

  // ====================== Export =======================
  gulp.task(
    'build',
    gulp.series('cleanBuild', (done) => {
      if (isStorybook) {
        storybookBuild(done);
      } else {
        webpackBuild(done);
      }
    }),
  );

  gulp.task(
    'gh-pages',
    gulp.series('build', (done) => {
      console.log('[storybook] gh-paging...');
      if (pkg.scripts['pre-gh-pages']) {
        shelljs.exec('npm run pre-gh-pages');
      }
      if (fs.existsSync(resolveCwd('./build/'))) {
        console.log(chalk.green('🏁 uploading...'));
        const ghPages = require('gh-pages');
        ghPages.publish(
          resolveCwd('build'),
          {
            logger(message) {
              console.log(message);
            },
          },
          () => {
            cleanBuild();
            console.log('gh-paged');
            done();
          },
        );
      } else {
        console.log(chalk.red('😢 `build` folder not exist. exit...'));
        done();
      }
    }),
  );
};
