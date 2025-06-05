import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

import UnocssPlugin from '@unocss/vite';

export default defineConfig({
  plugins: [
    solidPlugin(),
    UnocssPlugin({
      // your config or in uno.config.ts
    }),
  ],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    target: 'esnext',
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000')
  }
});
