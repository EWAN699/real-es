import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const executablePath = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export default defineConfig({
  ...base,
  projects: (base.projects ?? []).map((project) => ({
    ...project,
    use: { ...project.use, launchOptions: { executablePath } },
  })),
});
