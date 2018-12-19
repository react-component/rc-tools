'use strict';

const fs = require('fs');
const path = require('path');

function getConfigFilePath() {
  return path.join(process.cwd(), 'tsconfig.json');
}

function getTemplateConfigFilePath(fileName) {
  return path.join(__dirname, fileName);
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
};

// Provide `tsconfig.json` file path. If customize not exist, will create a tmp file for this.
getCompilerOptions.getConfigFilePath = function() {
  if (fs.existsSync(getConfigFilePath())) {
    return getConfigFilePath();
  }

  const defaultConfig = require(getTemplateConfigFilePath('tsconfig.json'));
  const tmpConfigFilePath = getTemplateConfigFilePath('~tsconfig.json');
  fs.writeFileSync(tmpConfigFilePath, JSON.stringify(defaultConfig));

  return tmpConfigFilePath;
};

module.exports = getCompilerOptions;