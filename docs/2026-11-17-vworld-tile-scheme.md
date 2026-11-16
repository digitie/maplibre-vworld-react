# 2026-11-17 — vworld:// 타일 스킴 전환(web 1.0.4)

`vworld-map-web`의 `vworld://` protocol handler는 `new URL(url).protocol = 'https:'`로 스킴을 바꾼 뒤 fetch했다.
WHATWG URL 표준은 `protocol` setter로 비특수 스킴(`vworld:`)을 특수 스킴(`https:`)으로 바꾸는 것을 무시한다.
Firefox·Safari(WebKit)·Node는 표준대로라 `vworld://…`를 그대로 fetch했고("CORS request not http"), `unsupportedTileFallback`을
켠 지도는 바탕지도 타일이 0건이었다. Chromium·Edge는 비표준으로 바꿔 줘서 드러나지 않았다(Pinvi 운영 Firefox
1440x900 실측 2026-11-16: 수정 전 api.vworld.kr 응답 0건, 스킴을 문자열로 바꾸면 200 35건).

수정: URL 해석을 `src/vworldTileRequest.ts`(`parseVWorldTileRequest`)로 빼고 스킴을 문자열로 바꾼다. fallback 전용
파라미터(`fallback`·`label`·`mapId`) 제거와 handler의 나머지 동작(커버리지 밖 XML fallback, `vworld-tile-error` 이벤트)은
그대로다. `test/vworldTileRequest.test.mjs`(node --test, dist 대상)는 수정 전 산출물에서 2건 실패, 수정 뒤 3건 통과다.

버전: `vworld-map-web` 1.0.3 → 1.0.4(core·RN 불변). 소비자(Pinvi)는 main HEAD의 Marker CI artifact
`marker-ci-<sha>`의 web tarball을 vendor한다.
