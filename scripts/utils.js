#!/usr/bin/env node
const {
  execSync, 
} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const {
  resolve, 
} = require('path');
const log = require('@capacitor/cli/dist/log');
const ip = require('ip');
const sharp = require('sharp');

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

async function resizePNG({
  src,
  dest,
  size,
  compressionLevel = 0,
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

function loadJsonFile(path) {
  return JSON.parse(fs.readFileSync(path, {
    encoding: 'utf8',
  }));
}

function getCapacitorConfig(path) {
  return loadJsonFile(resolve(path, 'capacitor.config.json'));
}

function getSpinoff(path) {
  try {
    return loadJsonFile(resolve(path, 'spinOff.json'));
  } catch (error) {
    return null;
  }
}

function requireSafe(path) {
  try {
    return require(path);
  } catch (error) {
    return;
  }
}

const capacitorPlatform = {
  'android': 'android/app/src/main/assets',
  'ios': 'ios/App/App',
};

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

function getCustomConfig(origin) {
  const customConfig = (
    requireSafe(resolve(origin, 'capacitor.custom.config.js'))
      || requireSafe(resolve(origin, 'capacitor.custom.config.cjs'))
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
      config: {
        ...config,
        ...spinOff?.config,
      },
      capacitorConfig,
      // origin,
      env: {
        platform,
        live,
        spinOff: spinOff ? {
          id: process.env.CAPACITOR_SPINOFF,
          ...spinOff,
        } : null,
      },
    };
  };

  return {
    origin,
    config,
    spinOffs,
    getSpinOffDirectory(destination, spinOff) {
      return customConfig.getSpinOffDirectory?.(destination, spinOff) || destination;
    },
    getConfig(options = {}) {
      options = getOptions(options);
      return customConfig.getConfig?.(options) || options.config;
    },
    callback(options = {}) {
      customConfig.callback?.(getOptions(options));
    },
    build(options = {}) {
      customConfig.build?.(getOptions(options));
    },
    generateAssets(options = {}) {
      customConfig.generateAssets?.(getOptions(options));
    },
    getLivePort: (
      customConfig.getLivePort
        ? (options = {}) => {
          return customConfig?.getLivePort(getOptions(options));
        }
        : undefined
    ),
  };
}

function run(command, options = {}) {
  console.log('[run]', command);
  execSync(command, {
    ...options,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function liveServer(path, port, status) {
  const platform = process.env.CAPACITOR_PLATFORM_NAME;

  if (!platform) {
    throw Error(`Cant generate assets for: ${platform}`);
  }

  if (!port) {
    throw Error('Missing port');
  }

  if (status) {
    updateCapacitorConfig(resolve(path, capacitorPlatform[platform]), {
      server: {
        url: `http://${ip.address()}:${port}`,
        cleartext: true,
      },
    });
  }

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

function getPlatform() {
  return process.env.CAPACITOR_PLATFORM_NAME;
}

function isLive() {
  return process.env.CAPACITOR_LIVE === 'true';
}

function isSpinoff() {
  return false;
}

module.exports = {
  resizePNG,
  getPlatform,
  isLive,
  isSpinoff,
  run,
  loadJsonFile,
  getCapacitorConfig,
  applyConfigTemplate,
  requireSafe,
  getCustomConfig,
  updateCapacitorConfig,
  capacitorPlatform,
  liveServer,
  getSpinoff,
};
