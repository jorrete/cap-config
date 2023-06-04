#!/usr/bin/env node
const appRoot = require('app-root-path');
const {
  getCustomConfig, 
} = require('./utils.js');

appRoot.setPath(process.cwd());

const customConfig = getCustomConfig(appRoot.path);

if (process.env.CAPACITOR_SPINOFF || process.env.CAPACITOR_LIVE === 'true') {
  process.exit(0);
}

customConfig.build();
