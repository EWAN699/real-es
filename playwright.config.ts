import { defineConfig, devices } from '@playwright/test';

/**
 * Chromium is preinstalled in this environment at PLAYWRIGHT_BROWSERS_PATH.
 * Never run `playwright install` here.
 *
 * Viewports mirror the RTL acceptance gate: 375 / 768 / 1440.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:4173',
    locale: 'he-IL',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  // Tests run against the prerendered production build, not the dev server —
  // otherwise the SSG output, which is what users actually receive, goes untested.
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
