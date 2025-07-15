import { defineConfig } from 'vite';
import { resolve } from 'path';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    webExtension({
      manifest: 'public/manifest.json',
      watchFilePaths: ['src/**/*', 'public/**/*'],
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        'popup-script': resolve(__dirname, 'src/popup.ts'),
        options: resolve(__dirname, 'src/options.html'),
        'options-script': resolve(__dirname, 'src/options.ts'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
      },
      external: ['chrome'],
    },
    target: 'ES2020',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis',
  },
  publicDir: 'public',
  server: {
    port: 3000,
    open: false,
  },
});