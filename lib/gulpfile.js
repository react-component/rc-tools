'use strict';

const gulp = require('gulp');
const path = require('path');
const through2 = require('through2');
const webpack = require('webpack');
const shelljs = require('shelljs');
const babel = require('gulp-babel');
const fs = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));
const postcss = require('gulp-postcss');
const chalk = require('chalk');
const ts = require('gulp-typescript');
const merge2 = require('merge2');
const glob = require('glob');
const watch = require('gulp-watch');
const assign = require('object-assign');
const targz = require('tar.gz');
const request = require('request');
const minify = require('gulp-babel-minify');
const prettier = require('gulp-prettier');

const resolveCwd = require('./resolveCwd');
const getWebpackConfig = require('./getWebpackConfig');
const { runCmd, getNpmArgs } = require('./util');
const getBabelCommonConfig = require('./getBabelCommonConfig');
const getNpm = require('./getNpm');
const tsConfig = require('./getTSCommonConfig')();
const { tsCompiledDir } = require('./constants');
const { measureFileSizesBeforeBuild, printFileSizesAfterBuild } = require('./FileSizeReporter');
const replaceLib = require('./replaceLib');
const { printResult } = require('./gulpTasks/util');
const genStorybook = require('./genStorybook');
const selfPackage = require('../package.json');

const pkg = require(resolveCwd('package.json'));
const cwd = process.cwd();
const lessPath = new RegExp(`(["']${pkg.name})/assets/([^.'"]+).less`, 'g');
const tsDefaultReporter = ts.reporter.defaultReporter();
const src = argv.src || 'src';

const tsFiles = [
  `${src}/**/*.@(png|svg|less)`,
  `${src}/**/*.tsx`,
  'examples/**/*.tsx',
  'tests/**/*.tsx',
  'typings/**/*.d.ts',
];

const mockRcTrigger = `
import React from 'react';

let Trigger;

const ActualTrigger = require.requireActual('rc-trigger');
const render = ActualTrigger.prototype.render;

ActualTrigger.prototype.render = function () {
  const { popupVisible } = this.state;
  let component;

  if (popupVisible || this._component) {
    component = this.getComponent();
  }

  return (
    <div id="TriggerContainer">
      {render.call(this)}
      {component}
    </div>
  );
};
Trigger = ActualTrigger;

export default Trigger;
`;

const mockRcPortal = `
import React from 'react';

export default class Portal extends React.Component {
  componentDidMount() {
    this.createContainer();
  }

  createContainer() {
    this.container = true;
    this.forceUpdate();
  }

  render() {
    const { children } = this.props;
    if (this.container) {
      return children;
    }
    return null;
  }
}
`;

// ============================== Clean ==============================
const cleanTasks = require('./gulpTasks/cleanTasks');

const { cleanCompile } = cleanTasks;

cleanTasks(gulp);

// ============================== Pages ==============================
require('./gulpTasks/pageTasks')(gulp);

// ============================== MISC ===============================
gulp.task(
  'check-deps',
  gulp.series(done => {
    if (argv['check-deps'] !== false) {
      require('./checkDep')(done);
    }
  })
);

function reportError() {
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
  console.log(chalk.bgRed('!! `npm publish` is forbidden for this package. !!'));
  console.log(chalk.bgRed('!! Use `npm run pub` instead.        !!'));
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}

gulp.task(
  'guard',
  gulp.series(done => {
    const npmArgs = getNpmArgs();
    if (npmArgs) {
      for (let arg = npmArgs.shift(); arg; arg = npmArgs.shift()) {
        if (/^pu(b(l(i(sh?)?)?)?)?$/.test(arg) && npmArgs.indexOf('--with-rc-tools') < 0) {
          reportError();
          done(1);
          return;
        }
      }
    }
    done();
  })
);

// ============================= Native ==============================
gulp.task(
  'react-native-init',
  gulp.series(done => {
    const myDevDeps = pkg.devDependencies;
    const myDeps = pkg.dependencies;
    const myVersion = myDeps['react-native'] || myDevDeps['react-native'];
    const bundleMap = {
      0.49: ['0.49', '0.x', '*'],
      0.48: ['0.48'],
      0.47: ['0.47'],
      0.46: ['0.46'],
      0.45: ['0.45'],
      0.44: ['0.44'],
      0.43: ['0.43'],
      0.42: ['0.42', '0.41', '0.40'],
      0.39: ['0.39'],
    };
    let bundleName;
    Object.keys(bundleMap).forEach(key => {
      if (bundleMap[key].find(v => myVersion.indexOf(v) > -1)) {
        bundleName = key;
      }
    });
    if (!bundleName) {
      console.warn(
        'warnings: rc-tools now supports react-native@~0.49.x,' +
          'and will install react-native@0.49.3, if has error, ' +
          'please manual init.'
      );
      bundleName = '0.49';
    }
    const read = request.get(`http://p.tb.cn/rmsportal_321_${bundleName}.tar.gz`);
    const write = targz().createWriteStream(process.cwd());
    read.pipe(write);
    done();
  })
);

// ============================== Test ===============================
gulp.task(
  'test:react-15',
  gulp.series(done => {
    console.log(chalk.yellow('Install react 15 dependenicy...'));
    shelljs.exec(
      'npm i --no-save react@15 react-dom@15 react-test-renderer@15 enzyme-adapter-react-15'
    );

    console.log(chalk.yellow('Read `tests/setup.js`...'));
    const testSetup = resolveCwd('./tests/setup.js');
    let content = fs.readFileSync(testSetup, 'UTF-8');

    content = content.replace('enzyme-adapter-react-16', 'enzyme-adapter-react-15');

    console.log(chalk.yellow('Modify `tests/setup.js` for `enzyme-adapter-react-15`...'));
    fs.writeFileSync(testSetup, content, 'UTF-8');

    // Add mock file
    const mockDir = resolveCwd('./tests/__mocks__/');

    console.log(chalk.yellow('Mock of `rc-trigger`...'));
    fs.ensureDirSync(mockDir);
    fs.writeFileSync(path.resolve(mockDir, 'rc-trigger.js'), mockRcTrigger, 'UTF-8');

    console.log(chalk.yellow('Mock of `rc-util/lib/Portal.js`...'));
    const rcUtilDir = path.resolve(mockDir, 'rc-util/lib');
    fs.ensureDirSync(rcUtilDir);
    fs.writeFileSync(path.resolve(rcUtilDir, 'Portal.js'), mockRcPortal, 'UTF-8');

    console.log(chalk.yellow('Start test...'));
    const ret = shelljs.exec('npx jest -u');

    done(ret.code);
  })
);

gulp.task('test', done => {
  let jestPath = require.resolve('jest');
  const cliRegex = /\/build\/jest\.js$/;

  if (!cliRegex.test(jestPath)) {
    console.log(chalk.red('Jest cli not found! Please reinstall or fire a issue fot this.'));
    done(1);
    return done(1);
  }

  jestPath = jestPath.replace(cliRegex, '/bin/jest.js');

  // Support args
  const additionalArgs = process.argv.slice(3);
  const mergedArgs = [
    'npx',
    jestPath,
    '--config',
    path.join(__dirname, './tests/ts-jest.config.js'),
    '--colors',
  ]
    .concat(additionalArgs)
    .join(' ');

  // verbose
  if (argv.verbose) {
    console.log(chalk.yellow('Execute test:'), mergedArgs);
  }

  const ret = shelljs.exec(mergedArgs);
  if (ret.code) {
    process.exit(ret.code);
  }

  done(ret.code);
});

// ============================= Package =============================
gulp.task('css', () => {
  const less = require('gulp-less');
  return gulp
    .src('assets/*.less')
    .pipe(less())
    .pipe(postcss([require('./getAutoprefixer')()]))
    .pipe(gulp.dest('assets'));
});

function babelifyInternal(js, modules) {
  function replacer(match, m1, m2) {
    return `${m1}/assets/${m2}.css`;
  }

  const babelConfig = getBabelCommonConfig(modules);
  if (modules === false) {
    babelConfig.plugins.push(replaceLib);
  }

  let stream = js.pipe(babel(babelConfig));
  if (argv.compress) {
    stream = stream.pipe(minify());
  }
  return stream
    .pipe(
      through2.obj(function(file, encoding, next) {
        const contents = file.contents.toString(encoding).replace(lessPath, replacer);
        file.contents = Buffer.from(contents);
        this.push(file);
        next();
      })
    )
    .pipe(gulp.dest(modules !== false ? 'lib' : 'es'));
}

function babelify(modules) {
  const streams = [];
  const assets = gulp
    .src([`${src}/**/*.@(png|svg|less|d.ts)`])
    .pipe(gulp.dest(modules === false ? 'es' : 'lib'));
  if (glob.sync('src/**/*.{ts,tsx}').length && !glob.sync('src/**/*.d.ts').length) {
    let error = 0;
    let reporter = tsDefaultReporter;
    if (argv['single-run']) {
      reporter = {
        error(e) {
          tsDefaultReporter.error(e);
          error = e;
        },
        finish: tsDefaultReporter.finish,
      };
    }

    const tsResult = gulp
      .src([`${src}/**/*.ts`, `${src}/**/*.tsx`, 'typings/**/*.d.ts'])
      .pipe(ts(tsConfig, reporter));

    const check = () => {
      if (error) {
        console.error('compile error', error);
        process.exit(1);
      }
    };
    tsResult.on('finish', check);
    tsResult.on('end', check);

    streams.push(
      tsResult.dts
        // .pipe(require('gulp-debug')())
        .pipe(gulp.dest(modules === false ? 'es' : 'lib'))
    );
    streams.push(babelifyInternal(tsResult.js, modules));
  } else {
    streams.push(babelifyInternal(gulp.src([`${src}/**/*.js`, `${src}/**/*.jsx`]), modules));
  }
  return merge2(streams.concat([assets]));
}

gulp.task('js', () => {
  console.log('[Parallel] compile js...');
  return babelify();
});

gulp.task('es', () => {
  console.log('[Parallel] compile es...');
  return babelify(false);
});

gulp.task('compile', gulp.series('cleanCompile', gulp.parallel('js', 'es', 'css')));

// ============================ Code Style ===========================

gulp.task(
  'genPrettierrc',
  gulp.series(done => {
    const dir = resolveCwd('./');
    const prettierrc = path.join(__dirname, '../config/.prettierrc');
    const prettierrcContent = fs.readFileSync(prettierrc);
    fs.writeFileSync(path.join(dir, './.prettierrc'), prettierrcContent);
    done();
  })
);

gulp.task(
  'genEslint',
  gulp.series(done => {
    const dir = resolveCwd('./');
    const eslintConfig = path.join(__dirname, '../config/eslintrc.js');
    const eslintContent = fs.readFileSync(eslintConfig);
    fs.writeFileSync(path.join(dir, './.eslintrc.js'), eslintContent);
    done();
  })
);

gulp.task(
  'genTslint',
  gulp.series(done => {
    const dir = resolveCwd('./');
    const tslintConfig = path.join(__dirname, '../config/tslint.json');
    const tslintContent = fs.readFileSync(tslintConfig);
    fs.writeFileSync(path.join(dir, './tslint.json'), tslintContent);

    const tsConfigPath = path.join(__dirname, '../config/tsconfig.json');
    const tsContent = fs.readFileSync(tsConfigPath);
    fs.writeFileSync(path.join(dir, './tsconfig.json'), tsContent);
    done();
  })
);

gulp.task(
  'prettier',
  gulp.series(() => {
    let fileList = (argv._ || []).slice(1);
    if (!fileList.length) {
      fileList = [
        './src/**/*.{js,jsx}',
        './tests/**/*.{js,jsx}',
        './code/**/*.{js,jsx}',
        './storybook/**/*.{js,jsx}',
        './examples/**/*.{js,jsx}',
      ];
    } else {
      console.log(chalk.blue(`Prettier:\n${fileList.join('\n')}`));
    }

    const prettierrc = path.join(__dirname, '../config/.prettierrc');
    const prettierrcContent = fs.readFileSync(prettierrc, 'utf8');
    return gulp
      .src(fileList)
      .pipe(
        prettier(JSON.parse(prettierrcContent), {
          reporter: 'error',
        })
      )
      .pipe(gulp.dest(file => file.base));
  })
);

gulp.task('gen-lint-config', gulp.series('genPrettierrc', 'genEslint', 'genTslint'));

gulp.task(
  'js-lint',
  gulp.series('check-deps', done => {
    const fileList = (argv._ || []).slice(1);
    if (argv['js-lint'] === false) {
      return done();
    }
    const eslintBin = require.resolve('eslint/bin/eslint');
    let eslintConfig = path.join(__dirname, '../config/eslintrc.js');
    const projectEslint = resolveCwd('./.eslintrc');
    if (fs.existsSync(projectEslint)) {
      eslintConfig = projectEslint;
    }
    let args = [eslintBin, '-c', eslintConfig];
    if (fileList.length) {
      const regex = /\.jsx?$/i;
      const jsFiles = fileList.filter(file => regex.test(file));
      if (!jsFiles.length) {
        done();
        return;
      }
      args = args.concat(jsFiles);
    } else {
      args = args.concat(['--ext', '.js,.jsx']);

      // eslint v5 will exit when not file find. We have to check first
      [src, 'tests', 'examples'].forEach(testPath => {
        if (glob.sync(`${testPath}/**/*.{js,ssx}`).length) {
          args.push(testPath);
        }
      });
    }
    if (argv.fix) {
      args.push('--fix');
    }

    runCmd('node', args, done);
  })
);

gulp.task(
  'ts-lint',
  gulp.series('check-deps', done => {
    const fileList = (argv._ || []).slice(1);
    const tslintBin = require.resolve('tslint/bin/tslint');
    let tslintConfig = path.join(__dirname, '../config/tslint.json');
    const projectTslint = resolveCwd('./tslint.json');
    if (fs.existsSync(projectTslint)) {
      tslintConfig = projectTslint;
    }
    let args = [tslintBin, '-c', tslintConfig];
    if (fileList.length) {
      const regex = /\.tsx?$/i;
      const tsFileList = fileList.filter(file => regex.test(file));
      if (!tsFileList.length) {
        done();
        return;
      }
      args = args.concat(tsFileList);
    } else {
      args = args.concat([
        `${src}/**/*{.ts,.tsx}`,
        'tests/**/*{.ts,.tsx}',
        'examples/**/*{.ts,.tsx}',
      ]);
    }

    runCmd('node', args, done);
  })
);

gulp.task('lint', gulp.series('ts-lint', 'js-lint'));

// =============================== NPM ===============================
// [Legacy] This task helps to generate dist folder with compressed js file.
// But `main` in `package.json` of RC is pointed to `lib/`.
// task is still keep here for user directly call, but we don't help to package it anymore.
gulp.task(
  'dist',
  gulp.series(done => {
    console.log(chalk.yellow(`Notice: 'dist' is marked as legacy. Maybe you don't need this.`));
    const entry = pkg.config && pkg.config.entry;
    if (!entry) {
      done();
      return;
    }
    let webpackConfig;
    const buildFolder = path.join(cwd, 'dist/');
    if (fs.existsSync(path.join(cwd, 'webpack.config.js'))) {
      webpackConfig = require(path.join(cwd, 'webpack.config.js'))(
        getWebpackConfig({
          common: false,
          inlineSourceMap: false,
        }),
        { phase: 'dist' }
      );
    } else {
      const output = pkg.config && pkg.config.output;
      if (output && output.library === null) {
        output.library = undefined;
      }
      webpackConfig = assign(
        getWebpackConfig({
          common: false,
          inlineSourceMap: false,
        }),
        {
          output: Object.assign(
            {
              path: buildFolder,
              filename: '[name].js',
              library: pkg.name,
              libraryTarget: 'umd',
              libraryExport: 'default',
            },
            output
          ),
          externals: {
            react: {
              root: 'React',
              commonjs2: 'react',
              commonjs: 'react',
              amd: 'react',
            },
            'react-dom': {
              root: 'ReactDOM',
              commonjs2: 'react-dom',
              commonjs: 'react-dom',
              amd: 'react-dom',
            },
          },
        }
      );
      const compressedWebpackConfig = Object.assign({}, webpackConfig);
      compressedWebpackConfig.entry = {};
      Object.keys(entry).forEach(e => {
        compressedWebpackConfig.entry[`${e}.min`] = entry[e];
      });
      compressedWebpackConfig.plugins = webpackConfig.plugins.concat([
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            screw_ie8: true, // React doesn't support IE8
            warnings: false,
          },
          mangle: {
            screw_ie8: true,
          },
          output: {
            comments: false,
            screw_ie8: true,
          },
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        }),
      ]);
      webpackConfig.entry = entry;
      webpackConfig = [webpackConfig, compressedWebpackConfig];
    }
    measureFileSizesBeforeBuild(buildFolder).then(previousFileSizes => {
      shelljs.rm('-rf', buildFolder);
      webpack(webpackConfig, (err, stats) => {
        if (err) {
          console.error('error', err);
        }
        stats.toJson().children.forEach(printResult);
        printFileSizesAfterBuild(stats, previousFileSizes, buildFolder);
        done(err);
      });
    });
  })
);

gulp.task(
  'publish',
  gulp.series('compile', done => {
    if (!fs.existsSync(resolveCwd('lib')) || !fs.existsSync(resolveCwd('es'))) {
      return done('missing lib/es dir');
    }
    console.log('publishing');
    const npm = argv.tnpm ? 'tnpm' : 'npm';
    const beta = !pkg.version.match(/^\d+\.\d+\.\d+$/);
    let args = [npm, 'publish', '--with-rc-tools'];
    if (beta) {
      args = args.concat(['--tag', 'beta']);
    } else if (argv.tag) {
      args = args.concat(['--tag', argv.tag]);
    }
    if (pkg.scripts['pre-publish']) {
      shelljs.exec(`npm run pre-publish`);
    }
    let ret = shelljs.exec(args.join(' ')).code;
    cleanCompile();
    console.log('published');
    if (!ret) {
      ret = undefined;
    }
    done(ret);
  })
);

gulp.task(
  'compile_watch',
  gulp.series('compile', done => {
    console.log('file changed');
    const outDir = argv['out-dir'];
    if (outDir) {
      fs.copySync(resolveCwd('lib'), path.join(outDir, 'lib'));
      fs.copySync(resolveCwd('es'), path.join(outDir, 'es'));
      if (fs.existsSync(resolveCwd('assets'))) {
        fs.copySync(resolveCwd('assets'), path.join(outDir, 'assets'));
      }
    }
    done();
  })
);

gulp.task('pre-commit', gulp.series('prettier', 'lint'));

gulp.task(
  'pub',
  gulp.series('publish', 'gh-pages', done => {
    console.log('tagging');
    const { version } = pkg;
    shelljs.cd(cwd);
    shelljs.exec(`git tag ${version}`);
    shelljs.exec(`git push origin ${version}:${version}`);
    shelljs.exec('git push origin master:master');
    console.log('tagged');
    done();
  })
);

// =========================== Deprecated ============================
gulp.task(
  'watch',
  gulp.series('compile_watch', done => {
    gulp.watch([`${src}/**/*.js?(x)`, `${src}/**/*.ts?(x)`, 'assets/**/*.less'], ['compile_watch']);
    done();
  })
);

function compileTs(stream) {
  const assets = stream
    .pipe(
      through2.obj(function(file, encoding, next) {
        if (!file.path.endsWith('tsx')) {
          this.push(file);
        }
        next();
      })
    )
    .pipe(gulp.dest(path.join(cwd, tsCompiledDir)));

  return merge2([
    assets,
    stream
      .pipe(
        through2.obj(function(file, encoding, next) {
          if (file.path.endsWith('tsx')) {
            this.push(file);
          }
          next();
        })
      )
      .pipe(ts(tsConfig))
      .js.pipe(
        through2.obj(function(file, encoding, next) {
          // console.log(file.path, file.base);
          file.path = file.path.replace(/\.[jt]sx$/, '.js');
          this.push(file);
          next();
        })
      )
      .pipe(gulp.dest(path.join(cwd, tsCompiledDir))),
  ]);
}

gulp.task(
  'compile_tsc',
  gulp.series(() => {
    shelljs.rm('-rf', resolveCwd(tsCompiledDir));
    return compileTs(
      gulp.src(tsFiles, {
        base: cwd,
      })
    );
  })
);

gulp.task(
  'watch-tsc',
  gulp.series('compile_tsc', done => {
    watch(tsFiles, f => {
      if (f.event === 'unlink') {
        return;
      }
      const myPath = path.relative(cwd, f.path);
      compileTs(
        gulp.src([myPath, 'typings/**/*.d.ts'], {
          base: cwd,
        })
      );
    });
    done();
  })
);

gulp.task(
  'update-self',
  gulp.series('compile', done => {
    getNpm(npm => {
      console.log(`${npm} updating ${selfPackage.name}`);
      runCmd(npm, ['update', selfPackage.name], c => {
        console.log(`${npm} update ${selfPackage.name} end`);
        done(c);
      });
    });
    done();
  })
);
gulp.task(
  'runGenStorybook',
  gulp.series(done => {
    const dir = resolveCwd('./');
    genStorybook(dir);
    done();
  })
);
