import { defineConfig, devices } from '@playwright/test';

// E2E tests run against the real app -- `npx sst shell -- pnpm run sst:dev` first (real Cognito +
// DynamoDB), then `pnpm --filter frontend test:e2e`. See bruno/ for the two test users this needs.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
