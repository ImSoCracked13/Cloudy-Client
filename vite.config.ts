import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import UnocssPlugin from '@unocss/vite';

export default defineConfig(({ mode }) => {

  // Load env variables based on mode (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Backend URL based on environment
  const backendUrl = mode === 'production' 
    ? 'https://cloudy-server.fly.dev'  // Production/Cloud server
    : 'http://localhost:3000';         // Development/Local server

  // Frontend URL based on environment
  const frontendUrl = mode === 'production'
    ? 'https://cloudy-client-rho.vercel.app'  // Production/Cloud client
    : 'http://localhost:3001';                // Development/Local client

  return {
    plugins: [
      solidPlugin(),
      UnocssPlugin(),
    ],
    base: '/',
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT || '3001'),
      // Configure CORS for local development
      proxy: mode !== 'production' ? {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
          ws: true
        }
      } : undefined
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,  // Remove console.* calls in production
          drop_debugger: true, // Remove debugger statements
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
      // Define environment-specific variables
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(mode === 'production' ? backendUrl : ''),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(frontendUrl),
      'import.meta.env.VITE_IS_PRODUCTION': mode === 'production',
      // EmailJS configuration
      'import.meta.env.VITE_EMAIL_SERVICE_ID': JSON.stringify(env.VITE_EMAIL_SERVICE_ID || 'service_ege9r9v'),
      'import.meta.env.VITE_EMAIL_TEMPLATE_ID': JSON.stringify(env.VITE_EMAIL_TEMPLATE_ID || 'template_srq2imp'),
      'import.meta.env.VITE_EMAIL_PUBLIC_KEY': JSON.stringify(env.VITE_EMAIL_PUBLIC_KEY || 'Ajpl74OWTk5bSN3zp'),
      // Google oAuth configuration
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || '584040192605-go1fbggkk7is3j7ntumq61d0d5gi8gj5.apps.googleusercontent.com')
    },
  }
});