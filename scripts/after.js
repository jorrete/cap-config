#!/usr/bin/env node
import appRoot from 'app-root-path';

import { applyConfigTemplate, getCustomConfig, liveServer } from './utils.js';

appRoot.setPath(process.cwd());

const customConfig = await getCustomConfig(appRoot.path);

customConfig.generateAssets();

applyConfigTemplate(
  appRoot.path,
  customConfig.getConfig(),
);

const live = process.env.CAPACITOR_LIVE === 'true';

if (customConfig.getLivePort) {
  liveServer(
    appRoot.path,
    customConfig.getLivePort(),
    customConfig.getLivePath(),
    live,
  );
}

customConfig.callback();
