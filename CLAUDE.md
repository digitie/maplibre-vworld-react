# CLAUDE.md — 프로젝트 컨텍스트

이 파일은 에이전트가 매 세션 시작 시 자동으로 읽어 현재 프로젝트 상태와 연속성을 파악하는 진입점이다.
프로젝트 규칙은 `AGENTS.md`에 정의한다.

## 프로젝트 현황

기존 `maplibre-vworld-js`를 포팅하고, React Native 플랫폼까지 지원 영역을 넓히기 위해 Turborepo 모노레포 기반으로 프로젝트를 재편하고 있다. 핵심 로직과 뷰 모델은 `vworld-map-core`로 통일하고, 플랫폼별 렌더러는 `vworld-map-rn`과 `vworld-map-web`으로 분리하는 작업이 진행 중이다.

### 현재 아키텍처

- **Monorepo**: NPM Workspaces + Turborepo
- **Core**: `packages/vworld-map-core` (TypeScript)
- **React Native**: `packages/vworld-map-rn` (`@maplibre/maplibre-react-native` 기반)
- **Web**: `packages/vworld-map-web` (`maplibre-gl` 기반)
- **API 디자인**: `VWorldMapViewProps`를 통한 단일 진입점 제공, MapLibre GL 의존성 캡슐화.

### 테스트 제약사항

- Expo 테스트 앱은 New Architecture, Dev Client, Android minSdk 23 이상, EAS Build 환경으로 설정한다.

## 로컬 개발 환경 레이아웃

```
F:\dev\maplibre-vworld-react\
├── package.json          # Root workspace 설정
├── turbo.json            # Turborepo 설정
├── packages/
│   ├── vworld-map-core/  # 공통 도메인/스타일 타입 및 로직
│   ├── vworld-map-rn/    # React Native용 MapLibre 어댑터
│   └── vworld-map-web/   # React DOM용 Web MapLibre 어댑터
└── apps/
    ├── expo-example/     # Expo Dev Client 기반 검증 앱
    └── web-example/      # Vite + React 기반 검증 앱
```
