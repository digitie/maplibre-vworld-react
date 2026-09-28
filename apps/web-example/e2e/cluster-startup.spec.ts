import { test, expect } from '@playwright/test';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4+vXrfwAJoQPf1gvoUgAAAABJRU5ErkJggg==', 'base64');

for (const late of [false, true]) test(`최초 묶음은 지도 이동 없이 표시된다 (load 이후 추가=${late})`, async ({ page }) => {
  await page.route('**://*.vworld.kr/**', (route) => route.fulfill({ contentType: 'image/png', body: png }));
  await page.goto(`/cluster-regression.html${late ? '?late' : ''}`);
  await expect(page.getByRole('button', { name: '3개 위치 묶음 펼치기', exact: true })).toBeVisible();
});
