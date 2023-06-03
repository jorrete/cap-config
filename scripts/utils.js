#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const glob = require('glob');
const { resolve } = require('path');
const log = require('@capacitor/cli/dist/log');
const ip = require("ip");

function subsitute(content, substitutions) {
  return Object.entries(substitutions).reduce(
    (
      result,
      [
        key,
        value,
      ],
    ) => {
      return result.replaceAll(key, value);
    },
    content,
  );
}

function applyConfigTemplate(
  path,
  substitutions,
) {
  const configDir = resolve(path, 'config');

  if (!fs.existsSync(configDir)) {
    return;
  }

  const folders = glob.globSync(configDir + '/*/**/');

  folders.forEach((folder) => {
    let relativePath = folder.replace(configDir, '').slice(1);

    if (relativePath === 'config') {
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
    const relativePath = subsitute(resolve(path, file.replace(configDir, '').slice(1)), substitutions);

    if (!fs.existsSync(relativePath)) {
      const content = fs.readFileSync(file, {
        encoding: 'utf8',
      });
      fs.writeFileSync(relativePath, subsitute(content, substitutions));
    }
  });

  log.logSuccess('cap config');
}

function loadJsonFile(path) {
  return JSON.parse(fs.readFileSync(path, {encoding: 'utf8'}));
}

function getCapacitorConfig(path) {
  return loadJsonFile(resolve(path, 'capacitor.config.json'));
}

function requireSafe(path) {
  try {
    return require(path)
  } catch (error) {
    return {};
  }
}

const capacitorPlatform = {
  'android': 'android/app/src/main/assets',
}

function updateCapacitorConfig(destinationDir, customCapacitorConfig = {}) {
  const capacitorConfig = getCapacitorConfig(destinationDir);

  const capacitorConfigPath = resolve(
    destinationDir,
    'capacitor.config.json',
  );

  fs.writeFileSync(capacitorConfigPath, JSON.stringify({
    ...capacitorConfig,
    ...customCapacitorConfig
  }, null, 2));
}

function getCustomConfig(origin) {
  const customConfig = requireSafe(resolve(origin, 'capacitor.custom.config.js'));
  const config = customConfig.config || {};
  const spinOffs = customConfig.spinOffs || {};
  const destination = origin;
  const getOptions = (options = {}) => {
    const platform = process.env.CAPACITOR_PLATFORM_NAME;
    const live = process.env.CAPACITOR_LIVE === 'true';
    const spinOff = spinOffs[process.env.SPINOFF];

    return {
      destination,
      ...options,
      config,
      origin,
      env: {
        platform,
        live,
        spinOff: spinOff ? {
          id: process.env.SPINOFF,
          ...spinOff,
        } : null,
      },
    };
  };

  return {
    origin,
    config,
    spinOffs,
    getDestinationDirectory(options = {}) {
      return customConfig.getDestinationDirectory?.(getOptions(options)) || options?.destination || destination;
    },
    getConfig(options = {}) {
      const spinOff = spinOffs[process.env.SPINOFF] || null;

      return customConfig.getConfig?.(getOptions({
        ...options,
        config: {
          ...options.config,
          ...spinOff?.config,
        },
      })) || {
        ...config,
        ...spinOff?.config,
      };
    },
    callback(options = {}) {
      customConfig.callback?.(getOptions(options));
    },
    build(options = {}) {
      customConfig.build?.(getOptions(options));
    },
    generateAssets(options = {}) {
      customConfig?.generateAssets(getOptions(options));
    },
    getLivePort(options = {}) {
      customConfig?.getLivePort(getOptions(options));
    },
  };
}

function run(command, options = {}) {
  const result = execSync(command, {
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

  if (status) {
    updateCapacitorConfig(resolve(path, capacitorPlatform[platform]), {
      server: {
        url: `http://${ip.address()}:${port}`,
        cleartext: true
      },
    });
  }

  if (platform === 'android') {
    const manifest = resolve(path, 'android/app/src/main/AndroidManifest.xml');
    let data = fs.readFileSync(manifest, {encoding: 'utf8'});
    const fix = ' android:usesCleartextTraffic="true"'

    if (status && !data.includes(fix)) {
      data = data.replace('<application', `<application${fix}`);
    }

    if (!status) {
      data = data.replace(fix, '');
    }

    fs.writeFileSync(manifest, data);
  }
}

module.exports = {
  run,
  loadJsonFile,
  getCapacitorConfig,
  applyConfigTemplate,
  requireSafe,
  getCustomConfig,
  updateCapacitorConfig,
  capacitorPlatform,
  liveServer,
}
