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

## 완료 결과와 남은 실패

- 운영 의존성 감사 실패: 기존 zod 4.4.3의 high 1건([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)). 전체 워크스페이스 감사는 기존 46건이다. 이번 diff는 의존성/lock 해석을 바꾸지 않고 web 버전만 1.0.2로 갱신한다.
- 순수 Node import 검사는 기존 CSS import 때문에 ERR_UNKNOWN_FILE_EXTENSION으로 실패했다. CSS를 처리하는 Vite 소비 프로젝트에서 tarball을 실제 설치하고 브라우저 검사 11개를 통과했으며 Node import 성공으로 보고하지 않는다.
- 첫 확장 브라우저 검사는 하니스 선택자 오류와 build 병렬 실행 중 HMR 지도 중복 생성으로 실패했다. 선택자를 수정하고 HMR dispose에서 React root/map을 정리한 뒤 순차 브라우저 검사로 통과했다.
- WSL에서 닫힌 localhost 포트의 초기 HTTP 탐지가 지연되는 경우가 있었다. 이 작업 전용 Vite 서버를 먼저 띄워 검사했으며 다른 작업자의 서버는 재사용하지 않았다.
- Pinvi 실제 앱 통합, Firefox/실제 GPU, 운영 지도/타일/provider는 검증하지 않았다. 빈 스타일의 기본 Marker, 라이브러리 PinMarker(커스텀 children portal), 일반 커스텀 SVG를 검증했다.
- Firefox PR #30의 1.0.1 변경은 포함하지 않았다. 현재 main 기준의 web 1.0.2이며 통합 순서와 다음 vendor pin은 메인 담당자가 결정한다.
- GitHub statusCheckRollup은 비어 있다. 독립 적대 리뷰 2건/정확 SHA CI는 미실행이며 메인 담당자에게 남긴다. Draft/미머지 상태를 유지한다.

## 구현과 검증

- 구현 커밋: acfa5810a84c66a6775eae617b2d7ab0d8a812a6.
- 위치/ARIA/이벤트 root와 portal 컨테이너를 유지하고 기존 portal 내부 div 및 기본 SVG만 확대한다. 커스텀 anchor 9종의 원점을 매핑하고 기본 핀 center에는 MapLibre 기본 -14px offset을 반영한다.
- 마커 재생성 시 class diff 기준을 초기화하고 현재 selected/ARIA/class 상태를 다시 적용한다. selected 상태에서 색상 변경 및 재마운트를 실측 검증했다.
- false→selected→highlighted→false의 고정 카메라/좌표 실측, 양쪽 DOM root 동일성, 외부 요청 0건, 실제 SVG 경로와 WebGL2를 확인했다.
- 기본 Marker 먼점 오차: false (-0.0042,0.7500)px → selected (-0.0050,0.8850)px → highlighted (-0.0046,0.8250)px → false 복귀. 원래 SVG 끝점/정수 offset 차이에서 subpixel 변동만 남는다.
- PinMarker 먼점 selected 오차: (0.00002,0.00001)px. 커스텀 children의 anchor 9종 + offset [13,-9]는 오차 0.1px 미만이다.
- 키보드 focus/Enter/Space, 실제 click/contextmenu와 전달 문맥, 색상 유지/변경, 실제 마우스 dragend, 제거/재마운트를 검사했다.
- 루트 npm run typecheck/build/lint/test 통과. lint는 기존 web 경고 13개, test는 기존 RN 21개다.
- npm run test:e2e -w apps/web-example -- --config playwright.marker.config.ts: 11개 통과.
- 위 회귀 검사를 별도 tarball 소비 프로젝트에서 반복해 11개 통과했다. workspace MapLibre 6.9.0, 소비 프로젝트 MapLibre 6.16.0, Playwright 1.61.0/Chromium headless/WebGL2를 사용했다.
- 자체 변경 보안 검토: 추가 네트워크/키/HTML 문자열 삽입/동적 코드 실행/새 의존성 없음. 생성된 tarball은 dist와 package.json만 포함하며 소스 코드·지도 키·환경 파일을 넣지 않는다.
- 실제 수치는 [기계 판독 실측 자료](marker-scale-623-evidence.json)에 보관한다. 기본 SVG/PinMarker 소스 SHA256과 tarball SHA256도 포함한다.

## 설치 가능한 인계 산출물

공통 경로: /home/digitie/vworld-workspaces/623-evidence.

| 산출물 | 경로 또는 SHA256 |
|---|---|
| web tarball | tarballs/vworld-map-web-1.0.2.tgz |
| web SHA256 | 73aa2d7f1b2280af1729341437de39fe46105fc5bdaa9d91ef6002dccf2c3213 |
| core tarball | tarballs/vworld-map-core-1.0.0.tgz |
| core SHA256 | 0b4c444667a1e25ec2dc2637cc4ef3dab183e4fd436ad2505b60c2f1fc3d3554 |
| 기준 소스 SHA | baseline-source-sha256.txt |
| 수정 소스/dist SHA | fixed-source-sha256.txt |
| 실측 로그 | baseline-browser.log, regression-browser.log, consumer-browser.log |
| 빌드/타입/린트/테스트 | build.log, typecheck.log, lint.log, test.log |
| 감사 | npm-audit.json, npm-audit-web-production.json |
| 설치 증거 | consumer-install.log, consumer-tree.log |
| 화면 증거 | before-selected.png, after-selected.png, baseline-test-results/, consumer-test-results/ |
| 도구 확인 | codegraph-before.txt, codegraph-impact.txt |
| 재실행 자료 | playwright.consumer.config.ts, consumer-install/ |

web과 core를 각각 file: 절대 경로로 소비 앱 의존성에 pin할 수 있다. 실제 검증 소비 프로젝트 package.json/package-lock.json도 위 경로에 보관했다.
npm registry에 발행하거나 Pinvi vendor 파일을 패치하지 않았다.
