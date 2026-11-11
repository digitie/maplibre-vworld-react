# 웹 패키지 컴파일 대상 수정

GitHub main 9c46c57181d433c91f7e8837c4e4396204e9b583에서 web 패키지의 ES6 대상과 Object.entries 사용이 충돌했다. 선택 workspace 의존성 설치 후 npm run build -w vworld-map-core는 통과했지만 npm run build -w vworld-map-web은 TS2550·TS7006으로 실패했다.

web 컴파일 대상을 ES2022로 맞추고 1.0.3 후보로 올렸다. 두 workspace 빌드가 이후 통과했으며 npm pack으로 core/web 설치 후보를 생성했다. 소비자 Next/Vite와 브라우저 검증, 독립 2인 리뷰와 CI는 별도 gate로 남아 있다. Node의 무설정 직접 import는 CSS 확장자 로더가 없어 실패하므로 브라우저 번들러 사용 계약과 구분한다.

React·MapLibre peer는 지원 major 범위로 두고 소비 프로젝트는 공통 정책의 정확 버전을 설치한다. 키·운영 호스트·외부 상태를 변경하지 않았다.

## 실행 결과

2026-11-11 Linux/Node22.22.2/npm11.19.1에서 core build, 전체 typecheck/build/lint, RN 기존21개 시험이 통과했다. 빈 스타일 Chromium 마커17개와 별도 npm tarball 소비자 Chromium17개도 통과했다. CI는 원격 PR에서 다시 확인한다.
