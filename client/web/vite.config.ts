import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true
        },
        '/api/shared': {
          target: env.VITE_SHARED_API_URL || 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    optimizeDeps: {
      esbuildOptions: {
        platform: 'browser'
      }
    }
  });
};
