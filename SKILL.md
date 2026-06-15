---
name: "React Native & Web VWorld Map Skills"
description: "MapLibre 기반 VWorld 맵 모노레포를 다루는 에이전트 지침서"
---

# SKILL.md

이 문서는 에이전트가 `maplibre-vworld-react` 프로젝트에서 작업할 때 지켜야 할 주요 패턴과 팁을 담고 있다.

## 컴포넌트 개발 지침

- **VWorldMapViewProps 준수**: 외부 사용자에게 노출되는 Prop은 `VWorldMapViewProps`를 따른다. 내부에서 사용하는 MapLibre 특화 속성(예: `styleURL`, `logoEnabled`)은 어댑터 단에서 감추고 캡슐화한다.
- **Expo 호환성**: Native 컴포넌트 작성 시 항상 Expo 환경에서 동작할 것을 염두에 둔다.
- **React Hook**: 이벤트 핸들링이나 Ref 작업 시 `useCallback`, `useRef`, `useMemo`를 적극적으로 활용해 렌더링 성능을 최적화한다.

## NPM Workspaces 사용

- 루트 경로에서 `npm install`을 실행하면 전체 패키지의 의존성이 설치되고 호이스팅된다.
- 특정 워크스페이스에 패키지를 추가할 때는 `-w` 옵션을 쓴다. (예: `npm install react-native-maps -w packages/vworld-map-rn`)

## MapLibre 팁

- `@maplibre/maplibre-react-native` 최신 버전(v11 이상)의 New Architecture 지원 사항을 따른다.
- `StyleSpecification` 객체를 `vworldStyle.ts`에서 생성할 때, 타일 소스 선언(source)과 레이어 추가(layer) 순서에 유의한다.
