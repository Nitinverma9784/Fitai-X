import { defineConfig, devices } from '@playwright/test';

/**
 * FitAI X — Unified Playwright Config
 *
 * Two projects:
 *   • e2e  — full browser tests against the Expo web app (http://localhost:8082)
 *   • api  — REST API tests against the backend (http://localhost:5000)
 *
 * Prerequisites before running:
 *   Terminal 1 → cd backend  && npm run dev         (backend on :5000)
 *   Terminal 2 → cd frontend && npx expo start --web --port 8082
 */
export default defineConfig({
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  projects: [
    // ── Browser (E2E) ─────────────────────────────────────────────────────────
    {
      name: 'e2e',
      testDir: './e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8081',
        headless: false,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        actionTimeout: 10000,
        navigationTimeout: 15000,
      },
    },

    // ── API (Backend REST) ────────────────────────────────────────────────────
    {
      name: 'api',
      testDir: './api',
      use: {
        baseURL: 'http://localhost:5000',
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },
  ],
});
