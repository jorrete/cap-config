import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../dist',
  },
  root: 'src',
  server: {
    host: true,
    port: 3335,
  },
});
