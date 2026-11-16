/**
 * `vworld://` 타일 URL → 실제 요청 URL과 fallback 전용 파라미터.
 *
 * maplibre 의존이 없는 순수 함수라 node 시험에서 바로 부른다(`test/vworldTileRequest.test.mjs`).
 */
export interface VWorldTileRequest {
  /** 실제로 fetch할 https URL(fallback 전용 파라미터 제거). */
  url: string;
  fallbackUrl: string | null;
  label: string | null;
  mapId: string | null;
}

const VWORLD_SCHEME = 'vworld://';

export function parseVWorldTileRequest(tileUrl: string): VWorldTileRequest {
  // 스킴은 문자열로 바꾼다. WHATWG URL은 `protocol` setter로 비특수 스킴(`vworld:`)을 특수 스킴(`https:`)으로
  // 바꾸는 것을 무시한다 — Firefox·Safari는 `vworld://`를 그대로 fetch해 바탕지도 타일이 전부 실패했다
  // (Chromium만 비표준으로 바꿔 줘서 드러나지 않았다).
  const httpsUrl = tileUrl.startsWith(VWORLD_SCHEME)
    ? `https://${tileUrl.slice(VWORLD_SCHEME.length)}`
    : tileUrl;
  const urlObj = new URL(httpsUrl);
  const fallbackUrl = urlObj.searchParams.get('fallback');
  const label = urlObj.searchParams.get('label');
  const mapId = urlObj.searchParams.get('mapId');

  urlObj.searchParams.delete('fallback');
  urlObj.searchParams.delete('label');
  urlObj.searchParams.delete('mapId');
  return { url: urlObj.toString(), fallbackUrl, label, mapId };
}
