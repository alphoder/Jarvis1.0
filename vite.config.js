import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: '127.0.0.1',
    open: false,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});
