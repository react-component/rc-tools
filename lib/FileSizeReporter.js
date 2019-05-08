/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const filesize = require('filesize');
const recursive = require('recursive-readdir');
const stripAnsi = require('strip-ansi');
const gzipSize = require('gzip-size').sync;

/* eslint prefer-template:0 */

function removeFileNameHash(buildFolder, fileName) {
  return fileName.replace(buildFolder, '');
}

// Input: 1024, 2048
// Output: "(+1 KB)"
function getDifferenceLabel(currentSize, previousSize) {
  const FIFTY_KILOBYTES = 1024 * 50;
  const difference = currentSize - previousSize;
  const fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
  if (difference >= FIFTY_KILOBYTES) {
    return chalk.red('+' + fileSize);
  } if (difference < FIFTY_KILOBYTES && difference > 0) {
    return chalk.yellow('+' + fileSize);
  } if (difference < 0) {
    return chalk.green(fileSize);
  }
  return '';
}

function measureFileSizesBeforeBuild(buildFolder) {
  return new Promise(resolve => {
    recursive(buildFolder, (err, fileNames) => {
      let sizes;
      if (!err && fileNames) {
        sizes = fileNames
          .filter(fileName => /\.(js|css)$/.test(fileName))
          .reduce((memo, fileName) => {
            const contents = fs.readFileSync(fileName);
            const key = removeFileNameHash(buildFolder, fileName);
            memo[key] = gzipSize(contents);
            return memo;
          }, {});
      }
      resolve({
        root: buildFolder,
        sizes: sizes || {},
      });
    });
  });
}

// Prints a detailed summary of build files.
function printFileSizesAfterBuild(
  webpackStats,
  previousSizeMap,
  buildFolder,
  maxBundleGzipSize,
  maxChunkGzipSize
) {
  const { root, sizes } = previousSizeMap;
  const stats = webpackStats.toJson();
  let assets = [];
  if (stats.children) {
    stats.children.forEach(c => {
      assets = assets.concat(c.assets);
    });
  } else {
    assets = stats.assets || [];
  }
  assets = assets.filter(asset => /\.(js|css)$/.test(asset.name)).map(asset => {
    const fileContents = fs.readFileSync(path.join(root, asset.name));
    const size = gzipSize(fileContents);
    const previousSize = sizes[removeFileNameHash(root, asset.name)];
    const difference = getDifferenceLabel(size, previousSize);
    return {
      folder: path.join(path.basename(buildFolder), path.dirname(asset.name)),
      name: path.basename(asset.name),
      size,
      sizeLabel: filesize(size) + (difference ? ' (' + difference + ')' : ''),
    };
  });
  assets.sort((a, b) => b.size - a.size);
  const longestSizeLabelLength = Math.max.apply(
    null,
    assets.map(a => stripAnsi(a.sizeLabel).length)
  );
  let suggestBundleSplitting = false;
  assets.forEach(asset => {
    let { sizeLabel } = asset;
    const sizeLength = stripAnsi(sizeLabel).length;
    if (sizeLength < longestSizeLabelLength) {
      const rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }
    const isMainBundle = asset.name.indexOf('main.') === 0;
    const maxRecommendedSize = isMainBundle ? maxBundleGzipSize : maxChunkGzipSize;
    const isLarge = maxRecommendedSize && asset.size > maxRecommendedSize;
    if (isLarge && path.extname(asset.name) === '.js') {
      suggestBundleSplitting = true;
    }
    console.log(
      '  ' +
        (isLarge ? chalk.yellow(sizeLabel) : sizeLabel) +
        '  ' +
        chalk.dim(asset.folder + path.sep) +
        chalk.cyan(asset.name)
    );
  });
  if (suggestBundleSplitting) {
    console.log();
    console.log(chalk.yellow('The bundle size is significantly larger than recommended.'));
    console.log(chalk.yellow('Consider reducing it with code splitting: https://goo.gl/9VhYWB'));
    console.log(
      chalk.yellow('You can also analyze the project dependencies: https://goo.gl/LeUzfb')
    );
  }
}

module.exports = {
  measureFileSizesBeforeBuild,
  printFileSizesAfterBuild,
};
