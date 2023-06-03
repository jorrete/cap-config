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

applyConfigTemplate(
  appRoot.path,
  customConfig.getConfig(),
);

const live = process.env.CAPACITOR_LIVE === 'true';

if (customConfig.getLivePort) {
  liveServer(appRoot.path, customConfig.getLivePort(), live);
}

customConfig.generateAssets();

customConfig.callback();
