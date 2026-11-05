# Pinvi #623 마커 확대 위치 수정 계획

## 재현 근거

- 기준: 최신 origin/main fb754755871ca8318907327c9a7d096dd96b1278.
- WSL ext4 격리 worktree에서 루트 npm ci 및 CodeGraph 색인/문맥 확인 후 재현했다.
- 빈 스타일(sources={}, layers=[]), 카메라 [127,37.5]/zoom 10/bearing 0/pitch 0 고정, 자체 React 하니스, Chromium 소프트웨어 WebGL2를 사용했다.
- 좌표를 화면 (80,100), (780,540)에서 한 번 역투영하고 false→selected→highlighted→false 동안 고정했다.
- 실제 SVG 외곽 경로를 10,001개 점으로 표본화해 최하단 끝점을 getScreenCTM으로 화면 변환하고 map.project와 비교했다.
- 기본 Marker selected 오차: 근점 (11.97,15.19)px, 먼점 (137.97,94.39)px.
- PinMarker selected 오차: 근점 (10.80,12.60)px, 먼점 (136.80,91.80)px.
- false 복귀 시 기본 Marker는 고유 SVG/offset 차이 약 0.75px, PinMarker는 0px로 돌아온다. transform 문자열이나 숨긴 범례로 판정하지 않았다.

## 최소 변경 계획

1. MapLibre 위치/이벤트/ARIA root를 유지한다.
2. 기본 SVG 및 children portal의 내부 시각 계층에만 확대를 적용한다. 사용자 anchor 및 기본 핀의 MapLibre 고유 offset을 고려해 확대 원점을 맞춘다.
3. 기존 API, 색상, click/contextmenu/keyboard/focus/drag, 커스텀 콘텐츠를 회귀 검증한다.
4. 루트 npm test/typecheck/lint/build 및 격리 브라우저 회귀를 실행하고 실패/한계를 기록한다.
5. npm 발행 없이 검증 tarball과 SHA256/source SHA를 인계한다. 로컬 Firefox 작업의 1.0.1과 혼동하지 않도록 web 패치 버전 계약을 확인한다.

## 범위와 인계

운영/SSH/VWorld/Geo/provider/Telegram에 접근하지 않는다. 기존 NTFS 원본 및 다른 작업자의 변경을 수정하지 않는다.
Draft PR만 유지하며 두 독립 적대 리뷰, 정확 SHA CI 및 ready/merge는 메인 담당자의 권한으로 남긴다.
전체 npm audit 기존 취약점 46개(critical 1/high 15/moderate 29/low 1)는 별도 기록하며 의존성 갱신을 이번 수정에 섞지 않는다.
