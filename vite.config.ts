import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the Worldbuilding Wiki.
 * 
 * base: './' ensures that assets are resolved relative to index.html, 
 * which is essential for GitHub Pages project sites hosted at subpaths.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 4173,
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
