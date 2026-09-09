import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// vitest's defineConfig, so the `test` block below is typed alongside Vite's own options.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Every route is prerendered to static HTML: this site lives on organic search.
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    crittersOptions: false,
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    // Fail the build rather than silently shipping an oversized bundle.
    chunkSizeWarningLimit: 300,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: true,
  },
});
