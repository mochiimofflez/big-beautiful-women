import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/big-beautiful-women/',
  plugins: [react()],
  server: {
    port: 4173,
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
