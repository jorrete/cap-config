import eslint from 'jorrodev-env/eslint.mjs';

export default [
  {
    ignores: [
      '**/spinOffs/**/*',
      '**/dist/**/*',
      '**/android/**/*',
      '**/ios/**/*',
    ],
  },
  ...eslint.configs.base,
];
