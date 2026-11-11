import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: ['marker-scale.spec.ts', 'map-style.spec.ts'],
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5183',
    viewport: { width: 1000, height: 760 },
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5183 --strictPort',
    url: 'http://127.0.0.1:5183/marker-regression.html',
    reuseExistingServer: !process.env.CI,
  },
});
