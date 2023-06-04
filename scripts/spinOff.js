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
  getCapacitorConfig,
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
const capacitorConfig = getCapacitorConfig(appRoot.path);

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
  const destination = customConfig.getSpinOffDirectory(resolve(spinOffsDir, id), spinOff);

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, {
      recursive: true,
    });
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

  fs.writeFileSync(resolve(destination, 'spinOff.json'), JSON.stringify({
    ...spinOff,
    id,
    root: appRoot.path,
  }, null, 2));

  updateCapacitorConfig(
    destination,
    {
      ...spinOff?.capacitorConfig,
      appId: spinOff?.capacitorConfig.appId || `${capacitorConfig.appId}.${id}`,
    },
  );

  customConfig.build();

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
