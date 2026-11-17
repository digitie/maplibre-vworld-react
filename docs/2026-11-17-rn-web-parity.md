# 2026-11-17 — RN과 web 수정 대조(rn 1.0.2)

`vworld-map-web`에 들어간 수정(#27·#28·#29·#31·#32·#33)을 `vworld-map-rn` 1.0.1과 대조했다. 실제 결함과 확인만 한 항목을 구분한다.

## 실제 결함(수정함)

| 항목 | 증상 | 수정 |
|---|---|---|
| `fitBounds` padding | handle이 `paddingPx`를 받고도 native camera에 넘기지 않아, 맞춘 핀이 화면 위 패널 밑에 들어갔다 | `padding: {top,right,bottom,left}`로 전달한다. 숫자 하나 또는 면별 객체(아래 시트용)를 받고, 지정하지 않으면 전과 같다 |
| 마커 anchor | RN `Marker`에 `anchor`·`offset`이 없어 모든 카드형 마커가 좌표 **가운데**에 놓였다. `PlaceMarker`·`Popup`이 그 장소를 덮었다(web은 `PlaceMarker` `anchor="bottom"`, offset `[0,-8]`, popup은 점 위) | `Marker`가 `anchor`·`offset`을 native marker에 전달한다(생략하면 native 기본 center). `PlaceMarker`·`Popup`은 `bottom`, `[0,-8]`. chip(`PriceMarker`·`WeatherMarker`)은 web처럼 가운데를 유지한다 |
| 명시 스타일(#32 계약) | web은 명시 `mapStyle`로 VWorld 키 없이 로컬 geometry·마커를 그린다. RN은 늘 VWorld 스타일을 만들었다 | RN 전용 선택 prop `mapStyle`(객체 또는 URL)을 추가했다. 주면 VWorld 스타일·`tileUrlTransform`·레이어 최대 줌 제한을 쓰지 않는다 |

`test/webParity.test.tsx` 12건 중 8건이 수정 전 코드에서 실패하고, 나머지 4건은 기존 동작을 지킨다. 수정 후에는 기존 21건을 포함해 33건이 모두 통과한다. public API는 추가·확장만 했다: `paddingPx`가 숫자 외에 면별 객체도 받는다(`VWorldViewPadding`), `VWorldMapViewNativeProps`(core `VWorldMapViewProps`의 상위 집합), `MarkerAnchor`, `Marker`의 `anchor`·`offset`.

## 확인만 함(해당 없음)

- #33 `vworld://` 스킴: RN은 custom protocol을 쓰지 않는다. 타일 URL은 core `getVWorldTileUrl`이 `https://api.vworld.kr/...`로 만들고 `tileUrlTransform`이 문자열로 바꾼다.
- #31 선택 확대 시 핀 끝점: web 결함은 MapLibre가 위치를 잡는 root를 CSS scale로 키운 데서 생겼다. RN은 native marker가 위치를 잡고 기본 핀(원)은 크기만 바꾸므로 anchor 점이 움직이지 않는다. children은 확대하지 않는다.
- #32 배포 고지: rn tarball에 LICENSE·NOTICE·src·tsconfig가 이미 동봉되고 `check:package-notices`가 rn도 검사한다.
- 키 처리: web·RN 모두 core가 키를 trim·encode한다. RN은 빈 키 fallback을 두지 않는다. `tileUrlTransform`으로 서버 토큰을 주입하는 설계(core props 문서)이기 때문이다.
- attribution: 두 adapter 모두 core 스타일 source의 `attribution`(공간정보 오픈플랫폼 브이월드)을 쓴다. RN은 attribution 위치를 오른쪽 아래에 둔다.
- 최대 줌: 두 adapter 모두 core `LAYER_PRESETS`(위성·하이브리드 18, 나머지 19)로 clamp한다.
- #28 커버리지 밖 XML·#29 첫 묶음 마커: web 타일 handler·DOM 마커 수명 문제라 native loader·native marker를 쓰는 RN에는 같은 경로가 없다.
- #27 키보드 접근성: RN `Marker`는 `ariaLabel`이 있으면 `accessibilityRole="button"`과 label을 단다.

## 배포

`vworld-map-rn` 1.0.1 → 1.0.2(core·web 불변). Marker CI가 같은 HEAD의 rn tarball도 pack한다(`pack-rn.json`, `tarballs/vworld-map-rn-1.0.2.tgz`).
