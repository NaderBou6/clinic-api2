import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [
    laravel({
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    react(),
  ],

  // هذا الجزء فقط عندما تشغل "npm run dev"
  ...(command === 'serve'
    ? {
        server: {
          host: true,
          port: 5173,
          strictPort: true,
          hmr: {
            host: '192.168.179.16',
          },
        },
      }
    : {}),
}));

