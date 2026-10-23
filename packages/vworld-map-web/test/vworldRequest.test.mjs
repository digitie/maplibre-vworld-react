import assert from 'node:assert/strict';
import { test } from 'node:test';
import { vworldRequestUrl } from '../dist/vworldRequest.js';

test('비표준 protocol을 HTTPS로 바꾸고 내부 fallback 인자만 제거한다', () => {
  const url = vworldRequestUrl('vworld://api.vworld.kr/req/wmts/1.0.0/test-key/Base/7/50/109.png?fallback=data%3Aimage%2Fpng%3Bbase64%2CAA%3D%3D&label=대체&mapId=map1&domain=example.org');
  assert.equal(url, 'https://api.vworld.kr/req/wmts/1.0.0/test-key/Base/7/50/109.png?domain=example.org');
});

test('HTTPS 타일 URL과 인코딩된 키·경로를 보존한다', () => {
  const url = 'https://api.vworld.kr/req/wmts/1.0.0/test%2Fkey/Base/19/203001/446002.png';
  assert.equal(vworldRequestUrl(url), url);
});
