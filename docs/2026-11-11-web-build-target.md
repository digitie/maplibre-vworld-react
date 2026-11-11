# 웹 패키지 컴파일 대상 수정

GitHub main 9c46c57181d433c91f7e8837c4e4396204e9b583에서 web 패키지의 ES6 대상과 Object.entries 사용이 충돌했다. 선택 workspace 의존성 설치 후 npm run build -w vworld-map-core는 통과했지만 npm run build -w vworld-map-web은 TS2550·TS7006으로 실패했다.

web 컴파일 대상을 ES2022로 맞추고 1.0.3 후보로 올렸다. 두 workspace 빌드가 이후 통과했으며 npm pack으로 core/web 설치 후보를 생성했다. 소비자 Next/Vite와 브라우저 검증, 독립 2인 리뷰와 CI는 별도 gate로 남아 있다. Node의 무설정 직접 import는 CSS 확장자 로더가 없어 실패하므로 브라우저 번들러 사용 계약과 구분한다.

React·MapLibre peer는 지원 major 범위로 두고 소비 프로젝트는 공통 정책의 정확 버전을 설치한다. 키·운영 호스트·외부 상태를 변경하지 않았다.

## 실행 결과

2026-11-11 Linux/Node22.22.2/npm11.19.1에서 core build, 전체 typecheck/build/lint, RN 기존21개 시험이 통과했다. 빈 스타일 Chromium 마커17개와 별도 npm tarball 소비자 Chromium17개도 통과했다. CI는 원격 PR에서 다시 확인한다.

## 적대 리뷰의 배포 고지 수정

기존 core/web/RN의 npm pack이 루트 GPL 전문을 자동으로 포함하지 않는 점을 재현했다. 각 패키지에 GPL-3.0-only metadata, LICENSE·NOTICE, 실제 TypeScript src와 tsconfig를 동봉한다. 원본 README의 GPL-3.0 범위를 확대하지 않는다. 이미 사용하던 core/RN1.0.0을 다른 bytes로 덮어쓰지 않고1.0.1로 올리며, 미출시 web1.0.3 후보는 새 core에 맞춘다. npm pack --dry-run 목록을 CI에서 검증한다.

## Map의 키 없는 geometry 동작 보존

실제 소비자 Map의 키 없는 geometry·bbox 조회가 최신 wrapper에서 초기화되지 않는 회귀를 재현했다. VWorldMapView에 mapStyle을 명시하면 해당 MapLibre 스타일로 키 없이 마운트하고 props의 maxZoom을 따른다. 생략한 기존 경로는 missing-api-key fallback과 VWorld 레이어 줌 상한을 유지한다. 스타일 변경은 기존 지도 인스턴스에 setStyle을 적용한다. 기본 키 검증 우회용 가짜 키나 앱별 MapLibre 생성자 복제는 사용하지 않는다.

명시 스타일의 keyless 마운트·로컬 마커·최대줌·스타일 교체/인스턴스 보존·외부 요청0과 기본 missing-api-key 경로를 Chromium2개 시험으로 검증했다. 기존 마커17개와 합계19개가 통과했다. tarball 소비자도 같은19개를 검증한다.
