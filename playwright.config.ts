import { defineConfig, devices } from '@playwright/test'

// End-to-end tests drive the real web app in a real browser. They need the API running
// too (start it in syncboard-api with `npm run start:dev`, port 3000). The web app runs
// on port 5173, the address the API allows by default, so no extra setup is needed.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts', // so Vitest, which looks for *.test.ts, never picks these up
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
