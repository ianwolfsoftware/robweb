import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  server: {
    host: '127.0.0.1',
    port: 6980,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:6981',
      '/go': 'http://127.0.0.1:6981',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
