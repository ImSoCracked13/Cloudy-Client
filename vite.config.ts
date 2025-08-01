import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import UnocssPlugin from '@unocss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      solidPlugin(),
      devtools({ autoname: true }),
      UnocssPlugin(),
    ],
    base: '/',
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT || '3001'),
      proxy: mode !== 'production' ? {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: true,
        }
      } : undefined
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'solid': ['solid-js'],
            'router': ['@solidjs/router'],
          }
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(env.VITE_FRONTEND_URL),
      'import.meta.env.VITE_IS_PRODUCTION': mode === 'production',
      'import.meta.env.VITE_EMAIL_SERVICE_ID': JSON.stringify(env.VITE_EMAIL_SERVICE_ID),
      'import.meta.env.VITE_EMAIL_TEMPLATE_ID': JSON.stringify(env.VITE_EMAIL_TEMPLATE_ID),
      'import.meta.env.VITE_EMAIL_PUBLIC_KEY': JSON.stringify(env.VITE_EMAIL_PUBLIC_KEY),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID)
    },
  }
});