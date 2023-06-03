#!/usr/bin/env node
const fs = require('fs');
const appRoot = require('app-root-path');
const { resolve } = require('path');
const {
  loadJsonFile,
  getCapacitorConfig,
  applyConfigTemplate,
  getCustomConfig,
  generateAssets,
  updateCapacitorConfig,
  capacitorPlatform,
  run,
  liveServer,
} = require('./utils.js');

appRoot.setPath(process.cwd());

const customConfig = getCustomConfig(appRoot.path);

if (process.env.CAPACITOR_SPINOFF) {
  return;
}

customConfig.build();
