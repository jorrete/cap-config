const {
  run,
} = require('cap-config/scripts/utils');

module.exports = {
  config: {
    'secret': 'cuesco',
  },
  getLivePort() {
    return 3333;
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
  build(options) {
    run(`npx vite build --emptyOutDir --outDir ${options.destination}/dist`);
  },
  getSpinOffDirectory(destination, spinOff) {
    void spinOff;
    return destination;
  },
  spinOffs: {
    'test': {
      data: {
        path: '/home',
      },
      config: {
        'extra': 'cuesco2',
        'mongo': 'farto',
      },
      capacitorConfig: {
        'appId': 'com.example.xxxxfarto',
        'appName': 'Vite!!',
        'webDir': 'dist',
        'bundledWebRuntime': false,
        'backgroundColor': '#8a1b1b',
        'plugins': {
          'Keyboard': {
            'resize': 'body',
            'resizeOnFullScreen': true,
          },
        },
        'cordova': {
          'preferences': {
            'StatusBarBackgroundColor': '#8a1b1b',
          },
        },
      },
    },
  },
};
