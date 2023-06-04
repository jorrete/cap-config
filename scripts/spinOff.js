#!/usr/bin/env node
const fs = require('fs');
const appRoot = require('app-root-path');
const {
  resolve, 
} = require('path');
const {
  getCustomConfig,
  run,
  updateCapacitorConfig,
} = require('./utils.js');
const [
  platform,
  spinOffId = null,
] = process.argv.slice(2);

if (!platform) {
  throw Error('Missing platform argument [android | ios]');
}

appRoot.setPath(process.cwd());

const customConfig = getCustomConfig(appRoot.path);

const spinOffsDir = resolve(appRoot.path, 'spinOffs');

if (!fs.existsSync(spinOffsDir)) {
  fs.mkdirSync(spinOffsDir);
}

const spinOffs = Object.entries(customConfig.spinOffs).filter(([
  id,
]) => {
  if (spinOffId) {
    return spinOffId === id;
  }

  return true;
});

spinOffs.forEach(([
  id,
  spinOff,
]) => {
  let destination =resolve(spinOffsDir, id);

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  [
    'config',
    'resources',
    'package.json',
    'capacitor.config.json',
    'capacitor.custom.config.js',
  ].forEach((path) => {
    fs.cpSync(
      appRoot.resolve(path),
      resolve(destination, path),
      {
        recursive: true,
      },
    );
  });

  updateCapacitorConfig(
    destination,
    {
      ...spinOff?.capacitorConfig,
    },
  );

  customConfig.build({
    destination,
  });

  if (fs.existsSync(resolve(destination, platform))) {
    run(`CAPACITOR_SPINOFF=${id} npx cap sync ${platform}`, {
      cwd: destination,
    });
  } else {
    run(`CAPACITOR_SPINOFF=${id} npx cap add ${platform}`, {
      cwd: destination,
    });
  }
});
