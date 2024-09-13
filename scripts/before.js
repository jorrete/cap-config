#!/usr/bin/env node
import appRoot from 'app-root-path';

import { getCustomConfig, getSpinoff, isLive } from './utils.js';

appRoot.setPath(process.cwd());

const customConfig = await getCustomConfig(appRoot.path);

if (getSpinoff(appRoot.path) || isLive()) {
  process.exit(0);
}

customConfig.build();
