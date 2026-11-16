// SPDX-License-Identifier: GPL-3.0-only
// `vworld://` 타일 URL을 실제 https 요청 URL로 바꾸는 규칙(빌드 산출물 dist를 시험한다).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVWorldTileRequest } from '../dist/vworldTileRequest.js';

const TILE =
  'vworld://api.vworld.kr/req/wmts/1.0.0/KEY/Base/8/100/218.png?label=VWorld+tile&mapId=m1&fallback=https%3A%2F%2Fexample.test%2Ff.png';

test('WHATWG URL은 protocol setter로 비특수(vworld:)→특수(https:) 스킴 전환을 무시한다', () => {
  // Firefox·Safari·Node는 이 규칙대로다(Chromium만 비표준으로 바꿔 준다). 그래서 setter로는 고칠 수 없다.
  const url = new URL(TILE);
  url.protocol = 'https:';
  assert.equal(url.protocol, 'vworld:');
});

test('vworld:// 타일은 https URL로 바뀌고 fallback 전용 파라미터는 빠진다', () => {
  assert.deepEqual(parseVWorldTileRequest(TILE), {
    url: 'https://api.vworld.kr/req/wmts/1.0.0/KEY/Base/8/100/218.png',
    fallbackUrl: 'https://example.test/f.png',
    label: 'VWorld tile',
    mapId: 'm1',
  });
});

test('파라미터가 없는 타일도 https로 바뀐다', () => {
  assert.equal(
    parseVWorldTileRequest('vworld://api.vworld.kr/req/wmts/1.0.0/KEY/Satellite/7/50/109.jpeg').url,
    'https://api.vworld.kr/req/wmts/1.0.0/KEY/Satellite/7/50/109.jpeg',
  );
});
