'use strict';

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();

function getConfigFilePath() {
  return path.join(cwd, 'tsconfig.json');
}

function getTemplateConfigFilePath(fileName) {
  return path.join(__dirname, '..', 'config', fileName);
}

// get `compilerOptions`
function getCompilerOptions() {
  const defaultConfig = require(getTemplateConfigFilePath('tsconfig.json'));

  let customizeConfig = {};
  if (fs.existsSync(getConfigFilePath())) {
    customizeConfig = require(getConfigFilePath()) || {};
  }

  return {
    ...defaultConfig.compilerOptions,
    ...customizeConfig.compilerOptions,
  };
}

function relativePath(subPath) {
  if (subPath[0] === '/') return subPath;
  return path.join(cwd, subPath);
}

// Provide `tsconfig.json` file path. If customize not exist, will create a tmp file for this.
getCompilerOptions.getConfigFilePath = function() {
  if (fs.existsSync(getConfigFilePath())) {
    return getConfigFilePath();
  }

  const defaultConfig = require(getTemplateConfigFilePath('tsconfig.json'));
  const tmpConfigFilePath = getTemplateConfigFilePath('~tsconfig.json');
  const tmpConfig = {
    ...defaultConfig,
    include: (defaultConfig.include || []).map(relativePath),

    compilerOptions: {
      ...defaultConfig.compilerOptions,
      rootDirs: defaultConfig.compilerOptions.rootDirs.map(relativePath),
    },
  };

  fs.writeFileSync(tmpConfigFilePath, JSON.stringify(tmpConfig, null, 2));

  return tmpConfigFilePath;
};

module.exports = getCompilerOptions;
