#!/usr/bin/env node
import log from '@capacitor/cli/dist/log.js';
import { execSync } from 'child_process';
import fs from 'fs';
import { glob } from 'glob';
import ip from 'ip';
import { resolve } from 'path';
import sharp from 'sharp';

function applyConfigTemplate(
  path,
  substitutions,
) {

  const platform = process.env.CAPACITOR_PLATFORM_NAME;
  const configDir = resolve(path, 'config');
  const capacitorConfig = getCapacitorConfig(path);
  substitutions = Object.fromEntries(
    [
      ...Object.entries(capacitorConfig),
      ...Object.entries(substitutions),
    ]
      .filter(([
        , value,
      ]) => typeof value !== 'object')
      .map(([
        key,
        value,
      ]) => [
        `$$${key}`,
        value,
      ]),
  );

  if (!fs.existsSync(configDir)) {
    return;
  }

  const folders = glob.globSync(configDir + '/*/**/');

  folders.forEach((folder) => {
    let relativePath = folder.replace(configDir, '').slice(1);

    if (!relativePath.startsWith(platform)) {
      return;
    }

    const finalPath = subsitute(resolve(path, relativePath), substitutions);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath);
    }
  });

  const files = glob.globSync(configDir + '/*/**', {
    nodir: true,
  });

  files.forEach((file) => {
    const relativePath = file.replace(configDir, '').slice(1);

    if (!relativePath.startsWith(`${platform}/`)) {
      return;
    }

    const content = fs.readFileSync(file, {
      encoding: 'utf8',
    });
    const destinationPath = subsitute(resolve(path, relativePath), substitutions);
    fs.writeFileSync(destinationPath, subsitute(content, substitutions));
  });

  log.logSuccess('cap config');
}

function getCapacitorConfig(path) {
  return loadJsonFile(resolve(path, 'capacitor.config.json'));
}

function getSpinoff(path) {
  try {
    return loadJsonFile(resolve(path, 'spinOff.json'));
  } catch (error) {
    void error;
    return null;
  }
}

function loadJsonFile(path) {
  return JSON.parse(fs.readFileSync(path, {
    encoding: 'utf8',
  }));
}

async function requireSafe(path) {
  try {
    return await import(path);
  } catch (error) {
    console.log(error);
    void error;
    return;
  }
}

async function resizePNG({
  compressionLevel = 0,
  dest,
  size,
  src,
}) {
  await sharp(src)
    .resize(size)
    .png({
      compressionLevel,
    })
    .toBuffer(function(err, buffer) {
      fs.writeFile(dest, buffer, () => {});
    });
}

function subsitute(content, substitutions) {
  return Object.entries(substitutions).reduce(
    (
      result,
      [
        key,
        value,
      ],
    ) => {
      if (!key.startsWith('$$')) {
        return result;
      }

      return result.replaceAll(key, value);
    },
    content,
  );
}

const capacitorPlatform = {
  'android': 'android/app/src/main/assets',
  'ios': 'ios/App/App',
};

async function getCustomConfig(origin) {
  const customConfig = (
    (await requireSafe(resolve(origin, 'capacitor.custom.config.js')))?.default
      || (await requireSafe(resolve(origin, 'capacitor.custom.config.cjs')))?.default
      || {}
  );
  const config = customConfig.config || {};
  const spinOffs = customConfig.spinOffs || {};

  let destination = origin;

  const getOptions = (options = {}) => {
    const platform = process.env.CAPACITOR_PLATFORM_NAME;
    const live = process.env.CAPACITOR_LIVE === 'true';
    const spinOff = getSpinoff(options.origin || origin);
    const capacitorConfig = getCapacitorConfig(origin, spinOff?.capacitorConfig);

    return {
      destination,
      origin,
      ...options,
      capacitorConfig,
      config: {
        ...config,
        ...spinOff?.config,
      },
      // origin,
      env: {
        live,
        platform,
        spinOff: spinOff ? {
          id: process.env.CAPACITOR_SPINOFF,
          ...spinOff,
        } : null,
      },
    };
  };

  return {
    build(options = {}) {
      customConfig.build?.(getOptions(options));
    },
    callback(options = {}) {
      customConfig.callback?.(getOptions(options));
    },
    config,
    generateAssets(options = {}) {
      customConfig.generateAssets?.(getOptions(options));
    },
    getConfig(options = {}) {
      options = getOptions(options);
      return customConfig.getConfig?.(options) || options.config;
    },
    getLivePath: (
      customConfig.getLivePath
        ? (options = {}) => {
          return customConfig?.getLivePath(getOptions(options));
        }
        : () => undefined
    ),
    getLivePort: (
      customConfig.getLivePort
        ? (options = {}) => {
          return customConfig?.getLivePort(getOptions(options));
        }
        : () => undefined
    ),
    getSpinOffDirectory(destination, spinOff) {
      return customConfig.getSpinOffDirectory?.(destination, spinOff) || destination;
    },
    origin,
    spinOffs: typeof spinOffs === 'object' ? spinOffs : await spinOffs(),
  };
}

function getPlatform() {
  return process.env.CAPACITOR_PLATFORM_NAME;
}

function isLive() {
  return process.env.CAPACITOR_LIVE === 'true';
}

function isSpinoff() {
  return false;
}

function liveServer(
  filePath,
  port,
  urlPath,
  status,
) {
  const platform = process.env.CAPACITOR_PLATFORM_NAME;

  if (!platform) {
    throw Error(`Cant generate assets for: ${platform}`);
  }

  if (!port) {
    throw Error('Missing port');
  }

  if (status) {
    updateCapacitorConfig(resolve(filePath, capacitorPlatform[platform]), {
      server: {
        cleartext: true,
        url: `http://${ip.address()}:${port}${urlPath ? `${urlPath}` : ''}`,
      },
    });
  }
  console.warn('Add android:usesCleartextTraffic="true" to android/app/src/main/AndroidManifest.xml');

  // if (platform === 'android') {
  //   const manifest = resolve(path, 'android/app/src/main/AndroidManifest.xml');
  //   let data = fs.readFileSync(manifest, {
  //     encoding: 'utf8',
  //   });
  //   const fix = ' android:usesCleartextTraffic="true"';
  //
  //   if (status && !data.includes(fix)) {
  //     data = data.replace('<application', `<application${fix}`);
  //   }
  //
  //   if (!status) {
  //     data = data.replace(fix, '');
  //   }
  //
  //   fs.writeFileSync(manifest, data);
  // }
}

function run(command, options = {}) {
  console.log('[run]', command);
  execSync(command, {
    ...options,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: 'inherit',
  });
}

function updateCapacitorConfig(destinationDir, customCapacitorConfig = {}) {
  const capacitorConfig = getCapacitorConfig(destinationDir);

  const capacitorConfigPath = resolve(
    destinationDir,
    'capacitor.config.json',
  );

  fs.writeFileSync(capacitorConfigPath, JSON.stringify({
    ...capacitorConfig,
    ...customCapacitorConfig,
  }, null, 2));
}

export {
  applyConfigTemplate,
  capacitorPlatform,
  getCapacitorConfig,
  getCustomConfig,
  getPlatform,
  getSpinoff,
  isLive,
  isSpinoff,
  liveServer,
  loadJsonFile,
  requireSafe,
  resizePNG,
  run,
  updateCapacitorConfig,
};
