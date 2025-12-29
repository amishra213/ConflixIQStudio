import react from '@vitejs/plugin-react';
import tailwind from 'tailwindcss';
import { defineConfig } from 'vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: './static',
  base: './',
  build: {
    outDir: 'distribution',
    emptyOutDir: true,
  },
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/api/filestore': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/api/config': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/api/workflow/search-v2': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/api/workflow/search': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    middlewareMode: false,
  },
});
