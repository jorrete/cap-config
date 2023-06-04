#!/usr/bin/env node
const appRoot = require('app-root-path');
const {
  getCustomConfig, 
  getSpinoff,
  isLive,
} = require('./utils.js');

appRoot.setPath(process.cwd());

const customConfig = getCustomConfig(appRoot.path);

if (getSpinoff(appRoot.path) || isLive()) {
  process.exit(0);
}

customConfig.build();
