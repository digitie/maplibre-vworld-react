import { test, expect } from '@playwright/test';

for (const custom of [false, true]) {
  test(`실제 SVG 끝점 고정 및 입력 회귀 (PinMarker=${custom})`, async ({ page }, testInfo) => {
    const external: string[] = [];
    await page.route('**/*', (route) => {
      if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
      external.push(route.request().url());
      return route.abort();
    });
    await page.goto(`/marker-regression.html${custom ? '?custom' : ''}`);
    await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
    const roots = await page.locator('.maplibregl-marker').elementHandles();
    const samples = [];
    for (const state of ['false', 'selected', 'highlighted', 'false']) {
      await page.getByRole('button', { name: state, exact: true }).click();
      await expect(page.locator('.maplibregl-marker').first()).toHaveAttribute('data-selected', String(state === 'selected'));
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      samples.push({ state, points: await page.evaluate(() => window.markerProbe.sample()) });
      await page.screenshot({ path: testInfo.outputPath(`${samples.length}-${state}.png`) });
    }
    await testInfo.attach('끝점 실측', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
    console.log(JSON.stringify({ custom, samples }));
    for (let i = 0; i < roots.length; i++) {
      expect(await roots[i].evaluate((root, i) => root === document.querySelectorAll('.maplibregl-marker')[i], i)).toBe(true);
    }
    expect(external).toEqual([]);
    for (const sample of samples) {
      expect(sample.points.map((point) => (point as { camera: unknown }).camera))
        .toEqual(samples[0].points.map((point) => (point as { camera: unknown }).camera));
    }
    // 기본 SVG 끝점과 MapLibre 기본 -14px offset에는 1px 미만의 고유 차이가 있다.
    for (const sample of samples) for (const point of sample.points as { error: number[]; webgl: boolean }[]) {
      expect(point.webgl).toBe(true);
      expect(Math.abs(point.error[0])).toBeLessThan(1);
      expect(Math.abs(point.error[1])).toBeLessThan(1);
    }
    const first = page.getByRole('button', { name: '검증 마커 0', exact: true });
    await first.focus();
    await expect(first).toBeFocused();
    await first.press('Enter');
    await first.press('Space');
    await first.click();
    await first.click({ button: 'right' });
    expect(await page.evaluate(() => window.markerProbe.events)).toMatchObject([
      { type: 'click', context: { source: 'marker', interactionId: 'probe-0' }, sameRoot: true },
      { type: 'click' }, { type: 'click' }, { type: 'contextmenu' },
    ]);
    await page.getByRole('button', { name: 'selected', exact: true }).click();
    await page.getByRole('button', { name: '색상 변경' }).click();
    await expect(first).toHaveAttribute('data-selected', 'true');
    await expect(first).toHaveClass(/probe-marker/);
    expect(await page.evaluate(() => window.markerProbe.sample())).toMatchObject([{ color: '#8844CC' }, { color: '#8844CC' }]);
    const box = await first.locator('svg').boundingBox();
    if (!box) throw new Error('드래그 대상 SVG가 없음');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 3 + 25, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.markerProbe.events.filter((event) => (event as { type: string }).type === 'dragend').length)).toBe(1);
    await page.getByRole('button', { name: '마커 토글' }).click();
    await expect(page.locator('.maplibregl-marker')).toHaveCount(0);
    await page.getByRole('button', { name: '마커 토글' }).click();
    await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
    await expect(first).toHaveAttribute('data-selected', 'true');
  });
}

for (const anchor of ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']) {
  test(`커스텀 children의 anchor/offset 유지 (${anchor})`, async ({ page }) => {
    await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto(`/marker-regression.html?shape&offset&anchor=${anchor}`);
    await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
    for (const state of ['false', 'selected', 'highlighted', 'false']) {
      await page.getByRole('button', { name: state, exact: true }).click();
      await expect.poll(async () => {
        const points = await page.evaluate(() => window.markerProbe.sample()) as { error: number[] }[];
        return Math.max(...points.flatMap((point) => point.error.map(Math.abs)));
      }).toBeLessThan(0.1);
    }
  });
}

for (const state of ['selected', 'highlighted']) {
  test(`기본 핀 동적 offset이 새 마커와 같은 끝점을 유지한다 (${state})`, async ({ page, context }, testInfo) => {
    await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('/marker-regression.html');
    await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
    const roots = await page.locator('.maplibregl-marker').elementHandles();
    await page.getByRole('button', { name: state, exact: true }).click();
    for (const [button, initial] of [['offset 설정', 'explicit'], ['offset 영점', 'zero'], ['offset 기본값', 'default']]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const fresh = await context.newPage();
      await fresh.goto(`/marker-regression.html?initial-offset=${initial}`);
      await expect(fresh.locator('.maplibregl-marker')).toHaveCount(2);
      await fresh.getByRole('button', { name: state, exact: true }).click();
      const actual = await page.evaluate(() => window.markerProbe.sample()) as { tip: number[]; camera: unknown; coordinate: unknown }[];
      const expected = await fresh.evaluate(() => window.markerProbe.sample()) as typeof actual;
      await testInfo.attach(`offset-${initial}`, { body: JSON.stringify({ actual, expected }), contentType: 'application/json' });
      console.log(JSON.stringify({ regression: 'offset', state, initial, actual, expected }));
      for (let i = 0; i < actual.length; i++) {
        expect(actual[i].camera).toEqual(expected[i].camera);
        expect(actual[i].coordinate).toEqual(expected[i].coordinate);
        expect(Math.abs(actual[i].tip[0] - expected[i].tip[0])).toBeLessThan(0.1);
        expect(Math.abs(actual[i].tip[1] - expected[i].tip[1])).toBeLessThan(0.1);
        expect(await roots[i].evaluate((root, i) => root === document.querySelectorAll('.maplibregl-marker')[i], i)).toBe(true);
      }
      await fresh.close();
    }
  });
}

for (const property of ['color', 'draggable']) for (const next of ['new', 'undefined']) {
  test(`커스텀 root 재사용 시 이전 class 제거 (${property} / ${next})`, async ({ page }, testInfo) => {
    await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('/marker-regression.html?shape');
    await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
    const root = await page.locator('.maplibregl-marker').first().elementHandle();
    if (!root) throw new Error('기존 root 없음');
    await root.evaluate((element) => element.classList.add('consumer-owned'));
    await page.getByRole('button', { name: `class ${property} ${next}`, exact: true }).click();
    const current = page.getByRole('button', { name: '검증 마커 0', exact: true });
    await expect(current).toBeVisible();
    const classes = await current.getAttribute('class');
    await testInfo.attach('재생성 후 class', { body: JSON.stringify({ property, next, classes }), contentType: 'application/json' });
    console.log(JSON.stringify({ regression: 'class', property, next, classes }));
    expect(await root.evaluate((element) => element === document.querySelector('.maplibregl-marker'))).toBe(true);
    await expect(current).not.toHaveClass(/probe-marker/);
    await expect(current).toHaveClass(/consumer-owned/);
    if (next === 'new') {
      await expect(current).toHaveClass(/probe-next/);
      await expect(current).toHaveClass(/shared-token/);
    } else {
      await expect(current).not.toHaveClass(/shared-token/);
    }
    await current.focus();
    await expect(current).toBeFocused();
    await current.press('Enter');
    expect(await page.evaluate(() => window.markerProbe.events.length)).toBe(1);
  });
}
