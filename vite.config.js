import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/storage': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        secure: true, // Set to true since Firebase Storage uses HTTPS
        rewrite: (path) => path.replace(/^\/storage/, ''),
      },
    },
  },
});
