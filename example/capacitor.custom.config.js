//const {
//  run,
//} = require('cap-config/scripts/utils');
import { run } from 'cap-config/scripts/utils.js';

export default {
  build(options) {
    run(`npx vite build --emptyOutDir --outDir ${options.destination}/dist`);
  },
  callback(options) {
    console.log(options);
  },
  config: {
    'secret': 'cuesco',
  },
  generateAssets(options) {
    const args = Object.entries({
      iconBackgroundColor: '#eeeeee',
      iconBackgroundColorDark: '#222222',
      splashBackgroundColor: '#eeeeee',
      splashBackgroundColorDark: '#111111',
    }).map(([
      key,
      value, 
    ]) => `--${key} '${value}'`).join(' ');

    run(
      `npx @capacitor/assets generate --${options.env.platform} ${args}`,
      {
        cwd: options?.destination,
      },
    );
  },
  getLivePort() {
    return 3335;
  },
  getSpinOffDirectory(destination, spinOff) {
    void spinOff;
    return destination + '/deploy';
  },
  spinOffs: {
    'test': {
      capacitorConfig: {
        'appId': 'foo.com',
        'appName': 'FARTO',
      },
      config: {
        'extra': 'cuesco2',
        'mongo': 'farto',
      },
      data: {
        path: '/home',
      },
    },
  },
};
