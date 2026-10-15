import { defineConfig } from 'vite';

export default defineConfig({
  root: 'AuraTheme/dist',
  css: {
    postcss: {
      plugins: [],
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: '../../dist_build',
    emptyOutDir: true,
  },
});
