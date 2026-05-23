import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { copyFile } from 'wpsjs/vite_plugins';

export default defineConfig({
  plugins: [
    copyFile({
      src: 'manifest.xml',
      dest: 'manifest.xml',
    }),
    vue(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    base: './',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
