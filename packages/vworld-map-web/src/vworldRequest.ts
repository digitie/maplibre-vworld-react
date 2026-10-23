/** 내부 타일 protocol URL을 fetch 가능한 HTTPS URL로 바꾼다. */
export function vworldRequestUrl(value: string): string {
  // URL.protocol setter는 비표준 scheme에서 HTTPS로의 전환을 무시한다.
  // 파싱 전에 scheme을 바꿔 Firefox에서도 반드시 HTTPS 요청을 만든다.
  const url = new URL(value.replace(/^vworld:/, 'https:'));
  url.searchParams.delete('fallback');
  url.searchParams.delete('label');
  url.searchParams.delete('mapId');
  return url.toString();
}
