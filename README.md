# maplibre-vworld-react

VWorld 지도 데이터를 **Web(React DOM)** 과 **React Native(Expo)** 양쪽에서 동일한 컴포넌트 모델로 표출하는 MapLibre 기반 모노레포다. 웹 라이브러리 [`maplibre-vworld-js`](https://github.com/digitie/maplibre-vworld-js)를 포팅하고 네이티브 플랫폼까지 지원 범위를 넓혔다.

## 패키지 구성

| 패키지 | 역할 | 기반 |
|--------|------|------|
| `vworld-map-core` | 공통 타입·카메라 모델·VWorld 타일/스타일 빌더·키 redaction (MapLibre 비의존 순수 TS) | TypeScript |
| `vworld-map-web` | 웹 어댑터 — 마커/레이어/팝업 등 전체 프리미티브 | `maplibre-gl` |
| `vworld-map-rn` | React Native 어댑터 | `@maplibre/maplibre-react-native` |
| `apps/web-example` | 웹 검증 앱 | Vite + React |
| `apps/expo-example` | 네이티브 검증 앱 | Expo Dev Client |

## 설치

이 라이브러리는 **npm에 발행하지 않는다(의도된 결정)**. 소비 경로는 둘 중 하나다.

1. **모노레포 직접 사용** — 본 저장소를 clone 후 워크스페이스로 작업하거나, 소비 앱을 `apps/`에 둔다.
2. **git 의존** — 소비 앱 `package.json`에서 git URL로 의존한다(서브패키지 경로 지정).

```bash
git clone https://github.com/digitie/maplibre-vworld-react.git
cd maplibre-vworld-react
npm install        # 전체 워크스페이스 의존 설치 + 호이스팅
npx turbo run build
```

## 사용법 — Web (`vworld-map-web`)

```tsx
import { VWorldMapView } from 'vworld-map-web';

export function Map() {
  return (
    <VWorldMapView
      apiKey={import.meta.env.VITE_VWORLD_API_KEY}  // 환경변수로 주입
      layerType="Base"                               // 'Base' | 'gray' | 'midnight' | 'Hybrid' | 'Satellite'
      center={[126.9780, 37.5665]}
      zoom={14}
    />
  );
}
```

웹은 마커(`Marker` / `PinMarker` / `MakiMarker` / `PriceMarker` / `PlaceMarker` / `WeatherMarker` …), 레이어(`ClusterLayer` / `RouteLine` / `PolygonArea`), `Popup`, `MapContextMenu`, zod 스키마, `useMap` 계열 hook 등 전체 프리미티브를 제공한다.

## 사용법 — React Native (`vworld-map-rn`)

```tsx
import { useRef } from 'react';
import { VWorldMapView, type VWorldMapHandle } from 'vworld-map-rn';

export function Map() {
  const mapRef = useRef<VWorldMapHandle>(null);
  return (
    <VWorldMapView
      ref={mapRef}
      apiKey={process.env.EXPO_PUBLIC_VWORLD_API_KEY ?? ''}
      mapType="base"                                 // 'base' | 'satellite' | 'hybrid' | 'gray' | 'midnight'
      initialCenter={[126.9780, 37.5665]}
      initialZoom={14}
      minZoom={6}
      markers={[{ id: '1', coordinate: [126.978, 37.5665], title: '서울시청' }]}
      onCameraChanged={(cam) => console.log(cam.zoom)}
      onError={(e) => console.warn(e.message)}
    />
  );
}

// 프로그래매틱 카메라 제어 (imperative handle)
mapRef.current?.flyTo({ center: [127.02, 37.53], zoom: 15 });
mapRef.current?.fitBounds({ sw: [126.7, 37.4], ne: [127.2, 37.7] });
```

RN은 `VWorldMapView` 외에 `Marker` / `Popup` / `PlaceMarker` / `PriceMarker` / `WeatherMarker` / `RouteLine` / `PolygonArea` / `ClusterLayer`, 그리고 `redactVWorldUrl` / `isVWorldTileError` 헬퍼를 제공한다.

### 네이티브 빌드 요건

- **Expo Dev Client 필수** — `@maplibre/maplibre-react-native`는 config plugin 기반 네이티브 모듈이라 **Expo Go에서 동작하지 않는다**. `expo-dev-client` + EAS Build로 개발 빌드를 만든다.
- **React Native New Architecture** 적용.
- **Android `minSdkVersion` 23 이상**.

### 지원 환경

| 항목 | 지원 범위 |
|------|-----------|
| Expo SDK | **54 이상** (maplibre-react-native v11 요건). SDK 53 이하는 미지원. |
| React Native | 0.80 이상 |
| `@maplibre/maplibre-react-native` | v11 (`^11.0.0`) |
| React | 19.1 이상 |

`expo`는 optional peer로 선언되어 있어 bare React Native에서도 사용할 수 있다.

## VWorld API 키 정책

- **키를 소스에 하드코딩하지 않는다.** 항상 환경변수/앱 설정으로 주입한다 (웹 `VITE_VWORLD_API_KEY`, Expo `EXPO_PUBLIC_VWORLD_API_KEY` 또는 EAS Secret).
- 키를 클라이언트 번들에 두면 안 되는 경우(서버 발행 토큰/타일 프록시), RN은 `tileUrlTransform(url) => url` prop으로 타일 요청을 자체 프록시로 재작성한다. 빈/placeholder `apiKey`를 넘기고 실제 토큰은 프록시에서 주입한다.
- 로그에 URL을 남길 때는 `redactVWorldUrl`로 키 세그먼트를 `***` 처리한다.

각 예제 앱에는 `.env.example`이 있다. `.env.local`에 키를 넣고 사용하며, 실제 키 파일은 커밋하지 않는다.

## 개발

루트에서 Turborepo 태스크로 실행한다.

```bash
npm run build       # 전체 패키지 빌드
npm run typecheck   # 타입 체크
npm run lint        # ESLint
npm run e2e         # web-example Playwright e2e (^build 선행)
```

## 라이선스

GPL-3.0 — `LICENSE` 참고.
