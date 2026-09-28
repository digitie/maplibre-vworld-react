import { test, expect } from '@playwright/test';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4+vXrfwAJoQPf1gvoUgAAAABJRU5ErkJggg==', 'base64');

for (const late of [false, true]) test(`최초 묶음은 지도 이동 없이 표시된다 (load 이후 추가=${late})`, async ({ page }) => {
  await page.route('**://*.vworld.kr/**', (route) => route.fulfill({ contentType: 'image/png', body: png }));
  await page.goto(`/cluster-regression.html${late ? '?late' : ''}`);
  await expect(page.getByRole('button', { name: '3개 위치 묶음 펼치기', exact: true })).toBeVisible();
  // 초기화 확인 전에는 loaded()를 복원하지 않아 느린 환경에서도 거짓 통과를 막는다.
  if (late) await page.getByRole('button', { name: '타일 갱신 완료', exact: true }).click();
});
