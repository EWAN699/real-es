import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

/**
 * Screenshots at 375 / 768 / 1440, plus a reduced-motion pass at each width.
 *
 *   npm run shots
 *
 * Chromium is PRE-INSTALLED in this environment (PLAYWRIGHT_BROWSERS_PATH is
 * already set). Never run `playwright install` — it has no network to do it
 * with, and there is nothing to install. The executable is resolved explicitly
 * below so the config also works where the env var is not set.
 */

/** The pre-installed headless-shell / chromium binary, if we can find it. */
function chromiumPath(): string | undefined {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;

  // Prefer full chromium over headless_shell: headless_shell cannot take
  // screenshots of some GPU-composited content.
  const dirs = readdirSync(base)
    .filter((d) => d.startsWith('chromium'))
    .sort((a, b) => Number(a.includes('headless')) - Number(b.includes('headless')));

  for (const dir of dirs) {
    for (const candidate of [
      'chrome-linux/chrome',
      'chrome-linux/headless_shell',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ]) {
      const p = path.join(base, dir, candidate);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

const executablePath = chromiumPath();

const WIDTHS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100',
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },

  projects: [
    ...WIDTHS.map((w) => ({
      name: w.name,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: w.width, height: w.height },
        isMobile: false,
        launchOptions: { executablePath },
      },
    })),
    // contracts/motion.spec.md rule 1: reduced motion is tested, not assumed.
    ...WIDTHS.map((w) => ({
      name: `${w.name}-reduced-motion`,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: w.width, height: w.height },
        isMobile: false,
        reducedMotion: 'reduce' as const,
        launchOptions: { executablePath },
      },
    })),
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run start -- --port 3100 --hostname 127.0.0.1',
        url: 'http://127.0.0.1:3100',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
