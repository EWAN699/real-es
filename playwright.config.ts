import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

/**
 * Viewports mirror the RTL acceptance gate: 375 / 768 / 1440.
 *
 * Browser resolution: the Claude Code remote environment ships a preinstalled
 * Chromium at /opt/pw-browsers and forbids `playwright install`. That build can
 * lag the revision the installed @playwright/test expects, which otherwise fails
 * every run with "Executable doesn't exist". When the preinstalled binary is
 * present we point at it explicitly; everywhere else — a developer machine, CI —
 * this is undefined and Playwright resolves its own browser as usual.
 */
const preinstalledChromium = '/opt/pw-browsers/chromium';
const executablePath = existsSync(preinstalledChromium) ? preinstalledChromium : undefined;

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
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },

  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  // Tests run against the prerendered production build, not the dev server —
  // otherwise the SSG output, which is what users actually receive, goes
  // untested. That distinction is what surfaced the script: 'async' hydration
  // bug, which was invisible to the unit suite.
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
