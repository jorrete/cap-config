// import { App } from '@capacitor/app';
// import { Device } from '@capacitor/device';
// import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
// import confit from '@confit';
//
// import './style.css'
//
// function addContent(key, value) {
//   const div = document.createElement('div');
//   div.innerHTML = `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
//   console.log(key, value);
//   document.body.firstElementChild.appendChild(div);
// }
//
//
// function addControl(text, callback) {
//   const button = document.createElement('button');
//   button.innerHTML = text;
//   button.onclick = callback;
//   document.body.firstElementChild.appendChild(button);
// }
//
// (async () =>  {
//   const isWeb = 'web' === (await Device.getInfo()).platform ;
//
//   function setTheme(theme) {
//     localStorage.setItem('theme', theme);
//
//     const state = (
//       theme === 'dark'
//         ? {
//           color: '#000000' ,
//           dark: false,
//           theme: 'dark',
//         }
//         : {
//           color: '#FFFFFF' ,
//           dark: true,
//           theme: 'light',
//         }
//     )
//
//     document.documentElement.setAttribute('theme', state.theme);
//     document.documentElement.setAttribute('ready', '');
//
//     if (!isWeb) {
//       // StatusBar.overlaysWebView(true)
//       StatusBar.backgroundColorByHexString(state.color);
//       StatusBar[state.dark ? 'styleDefault' : 'styleLightContent']();
//       NavigationBar.setColor({ color: state.color, darkButtons: state.dark });
//     }
//
//   }
//
//   addContent('confit', confit);
//
//   // Device
//   addContent('Device.getId', await Device.getId());
//   addContent('Device.getInfo', await Device.getInfo());
//   if (!isWeb) {
//     addContent('Device.getBatteryInfo', await Device.getBatteryInfo());
//   }
//   addContent('Device.getLanguageCode',await  Device.getLanguageCode());
//
//   // App
//   if (!isWeb) {
//     addContent('App.getInfo', await App.getInfo());
//   }
//   addContent('App.getState', await App.getState());
//   App.addListener('appStateChange', (state) => {
//     addContent('App.appStateChange', state);
//   });
//
//   // Theme
//   addControl('theme light', () => setTheme('light'));
//   addControl('theme dark', () => setTheme('dark'));
//   const theme = localStorage.getItem('theme') || 'light';
//
//   // Statusbar
//   if (!isWeb) {
//     StatusBar.height((height) => {
//       addContent('Statusbar.height', height);
//       document.documentElement.style.setProperty('--statusbar-height', `${height}px`);
//       setTheme(theme);
//     });
//   } else {
//     setTheme(theme);
//   }
// })();
