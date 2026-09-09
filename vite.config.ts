import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// vitest's defineConfig, so the `test` block below is typed alongside Vite's own options.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves a project site from a subpath. Unset elsewhere, so a
  // production build for the real domain stays rooted at '/'.
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Every route is prerendered to static HTML: this site lives on organic search.
  ssgOptions: {
    /*
     * `defer`, not `async`.
     *
     * `async` let the entry module execute while the body was still parsing, so
     * `createBrowserRouter` ran before the inline scripts at the end of the
     * document had set `window.__staticRouterHydrationData` and
     * `window.__VITE_REACT_SSG_HASH__`. React Router then re-ran the route
     * loader instead of hydrating, the loader fetched
     * `static-loader-data-manifest-undefined.json`, the dev server's SPA
     * fallback answered with index.html, and `.json()` threw. Every visitor got
     * "Unexpected Application Error!" in place of the page.
     *
     * Caught by the Playwright suite in e2e/, which runs against the
     * prerendered build rather than the dev server.
     */
    script: 'defer',
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
