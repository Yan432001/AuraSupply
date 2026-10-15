import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Helper to resolve an optional dependency from local AuraTheme/node_modules, root ../node_modules, or local stub
function resolveOptionalPackage(pkgName, fallbackRelativePath) {
  const localDir = path.resolve(__dirname, 'node_modules', pkgName);
  const parentDir = path.resolve(__dirname, '..', 'node_modules', pkgName);
  if (fs.existsSync(localDir)) return localDir;
  if (fs.existsSync(parentDir)) return parentDir;
  return path.resolve(__dirname, fallbackRelativePath);
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: true,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@logos', replacement: path.resolve(__dirname, './public/logos') },
      { find: '@AdCat', replacement: path.resolve(__dirname, './src/assets/styles') },
      { find: '@ant-design/v5-patch-for-react-19', replacement: path.resolve(__dirname, './src/utils/antdPatch.js') },
      { find: 'jspdf', replacement: resolveOptionalPackage('jspdf', './src/utils/jspdfStub.js') },
      { find: 'jsqr', replacement: resolveOptionalPackage('jsqr', './src/utils/jsqrStub.js') },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      allow: ['..'],
    },
  },
});
