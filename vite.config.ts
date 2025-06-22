import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import UnocssPlugin from '@unocss/vite';

export default defineConfig(({ mode }) => {
  // Load env variables based on mode (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Default to cloud server URL if no backend URL is specified
  const backendUrl = env.VITE_BACKEND_URL || 'https://cloudy-server.fly.dev';

  return {
    plugins: [
      solidPlugin(),
      UnocssPlugin({
        // your config or in uno.config.ts
      }),
    ],
    base: '/', // Ensure relative paths
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT || '3001'),
      proxy: mode === 'development' ? {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
          ws: true,
        }
      } : undefined
    },
    build: {
      assetsInlineLimit: 0, // Prevent data-URLs for assets
      target: 'esnext',
      outDir: 'dist',
    },
    optimizeDeps: {
      include: ['solid-js', 'solid-js/store', 'solid-js/web', '@solidjs/router']
    },
    define: {
      // Define all environment variables that should be accessible in the client code
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(backendUrl),
      'import.meta.env.VITE_IS_PRODUCTION': mode === 'production'
    },
    safelist: [
      'w-1/2', // Explicitly safelist fractions
      'md:w-1/2'
    ]
  };
});