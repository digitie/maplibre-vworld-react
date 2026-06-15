import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E config for the web-example app. Playwright boots the Vite dev server with
 * a dummy VWorld API key so the map mounts (real tiles 404 — irrelevant for the
 * structural/interaction checks here) and runs the specs in headless chromium.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Dummy key so VWorldMapView mounts MapLibre instead of the missing-key
      // fallback. Never a real key (AGENTS.md).
      VITE_VWORLD_API_KEY: 'e2e-dummy-key',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // Software WebGL (swiftshader) so MapLibre's WebGL context
          // initializes headless without a GPU.
          args: [
            '--enable-unsafe-swiftshader',
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
  ],
});
