import { test, expect } from '@playwright/test';

/**
 * E2E for the VWorld web-example. Runs against the real Vite app in headless
 * chromium with a dummy API key. Tiles will 404 (no real key), so these checks
 * cover the app shell, MapLibre mount, and layer-switch interaction — not tile
 * imagery.
 */

const LAYER_BUTTONS = ['Base', 'Satellite', 'Hybrid', 'Midnight'] as const;

test('renders the app shell and layer controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('VWorld MapLibre (Web)')).toBeVisible();
  for (const label of LAYER_BUTTONS) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
});

test('mounts the MapLibre map container and WebGL canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('vworld-map-container')).toBeVisible();
  // maplibre-gl injects its canvas once the WebGL context initializes.
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
});

test('switching layers keeps the map mounted with no uncaught errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto('/');
  await expect(page.getByTestId('vworld-map-container')).toBeVisible();
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });

  // Click through every layer; the container must survive each style swap.
  for (const label of ['Satellite', 'Hybrid', 'Midnight', 'Base'] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByTestId('vworld-map-container')).toBeVisible();
  }

  expect(pageErrors, `unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
});
