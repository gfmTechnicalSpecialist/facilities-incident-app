import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/gfmapi': {
        target: 'https://gfmapi-fpgth4e8aqa8auae.northeurope-01.azurewebsites.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gfmapi/, ''),
      },
    },
  },
});
