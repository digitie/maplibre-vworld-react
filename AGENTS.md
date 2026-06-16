# AGENTS.md

## Think Before Coding

- 요청이 모호할 때는 해석을 조용히 정하지 말 것
- 중요한 가정은 숨기지 말고 드러낼 것
- 해석에 따라 구현 방향이 크게 달라지면 그 차이를 먼저 표면화할 것
- 안전하게 진행하기 어려울 정도로 혼란스러우면 추측하지 말고 확인할 것

## Simplicity First

- 요청을 완전히 해결하는 최소한의 코드만 작성할 것
- 요청되지 않은 기능을 추가하지 말 것
- 일회성 용도를 위해 추상화를 만들지 말 것
- 구체적인 필요 없이 설정 가능성이나 유연성을 늘리지 말 것
- 구현이 문제에 비해 커졌다고 느껴지면 줄일 것

## Surgical Changes

- 요청을 처리하는 데 필요한 코드만 변경할 것
- 작업이 요구하지 않으면 주변 로직까지 다시 쓰지 말 것
- 관련 없는 코드의 포맷, 이름, 스타일을 건드리지 말 것
- 사용자가 더 넓은 변경을 원한 것이 아니라면 기존 패턴을 맞출 것
- 관련 없는 문제를 발견하면 패치에 섞지 말고 따로 언급할 것

## Goal-Driven Execution

- 모호한 요청을 구체적이고 검증 가능한 결과로 바꿀 것
- 버그 수정은 재현 없이 바로 신뢰하지 말 것
- 리팩터링은 동작 보존을 전제로 전후 기대를 확인할 것
- 넓고 막연한 점검보다 목적이 분명한 검증을 선호할 것
- 완전한 검증이 불가능하면 무엇이 아직 미검증인지 밝힐 것

## Practical Bias

- 비단순 작업에서는 성급함보다 신중함을 우선할 것
- 변경 내역은 리뷰 가능한 범위와 요청 범위에 가깝게 유지할 것
- 아주 단순하고 명백한 한 줄 작업은 과하게 무겁게 다루지 말 것

## 문서 언어 정책

이 저장소의 **모든 Markdown 문서는 한글로 작성한다**. 예외 없음. `README.md`, `CLAUDE.md`, `SKILL.md`도 본문은 한글이다.

다음 항목만 영어를 유지한다 — 한글로 옮기면 의미가 변하거나 정확성이 깨지기 때문:

- **코드 식별자**: 함수/타입/prop/이벤트/모듈 이름 (`VWorldMapViewProps`, `CameraState`, `createVWorldStyle`).
- **명령어와 경로**: `npm run dev`, `turbo run build`, `packages/vworld-map-rn`.
- **외부 공식 용어**: React Native, Expo, MapLibre GL JS, WMTS, Turborepo, NPM Workspaces.
- **벤더/제품명**: VWorld, MapLibre.
- **표준 keyword**: ADR, CHANGELOG, ISO 8601 날짜, semver 라벨(`Added`/`Changed`/`Removed`/`Fixed`/`Security`).

설명 문장, 절제목, 표 column 헤더, ADR 본문, 빠른 시작 가이드, 일지 항목은 한글로 적는다. 새 문서를 만들 때 영문 초안을 두지 않는다 — 처음부터 한글로 쓴다.

## 역할

이 저장소(GitHub 저장소 이름 `maplibre-vworld-react`)는 `@maplibre/maplibre-react-native` 및 `maplibre-gl` 기반으로 VWorld 지도 데이터를 표출하는 **통합 컴포넌트 라이브러리 모노레포**이다.

1. **`vworld-map-core`**: VWorld 공통 설정(API 키, 타일 URL), 카메라 모델, 공통 타입 모델을 관장하는 순수 TS 패키지.
2. **`vworld-map-rn`**: React Native + MapLibre 어댑터. Expo 프로젝트 및 New Architecture 환경에서 VWorld 지도를 표시한다.
3. **`vworld-map-web`**: React DOM + MapLibre GL JS 어댑터. 웹 환경에서 VWorld 지도를 표시한다.
4. **`apps/expo-example` / `apps/web-example`**: 패키지 렌더링 검증용 테스트 앱.

## 개발 환경 정책

- **패키지 매니저**: NPM Workspaces (최상위 경로에서 `npm install`)
- **빌드 도구**: Turborepo (`npx turbo run build`)
- **React Native 규칙**:
  - Expo Dev Client + EAS Build 사용 (Expo Go 미사용)
  - React Native New Architecture 적용
  - Android minSdk 23 이상
- **외부 API Key**: VWorld API 키 등은 컴포넌트에 하드코딩하지 않고 props 또는 런타임 환경변수/앱 설정(eas.json, app.json)을 통해 주입한다.

## 절대 하지 말 것 (DO NOT)

1. **`main` 직접 푸시 금지** — 반드시 feature 브랜치 생성 후 작업하여 Pull Request(PR)를 작성하고 머지한다.
2. **API 키 평문 커밋 금지** — VWorld 서비스 키 등은 절대로 소스코드에 커밋하지 않는다.
3. **MapLibre 의존성 유출 방지** — `VWorldMapViewProps` 처럼 도메인에 특화된 인터페이스를 제공하고, 외부 소비자가 MapLibre의 내부 타입/컴포넌트를 직접 사용하게 유도하지 않는다.

## 작업 후 체크리스트

- [ ] 패키지 TypeScript 빌드 통과 (`npm run typecheck`)
- [ ] 린트 규칙 통과 (`npm run lint`)
- [ ] `apps/expo-example` 등에서 실제 렌더링 정상 동작 확인
- [ ] PR 생성
