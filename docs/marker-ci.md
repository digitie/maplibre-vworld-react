# 마커 HEAD 검증 CI

## 검증 대상과 환경

[workflow](../.github/workflows/marker-ci.yml)는 main 대상 PR 갱신과 main push에서 단일 Linux job을 실행한다.
PR에서는 임시 merge commit 대신 github.event.pull_request.head.sha를 checkout하고 git rev-parse HEAD와 일치하는지 검사한다.
따라서 PR head가 바뀌면 새 SHA의 성공을 다시 확인해야 한다. 이전 SHA의 성공으로 ready/merge하지 않는다.

Ubuntu 24.04, Node 22.22.2, npm 11.19.1을 고정한다. 현재 lockfile의 Vite 8.0.16, ESLint 10.5.0, React Native 0.85.3 engines가 이 Node 버전을 허용함을 확인했다.
npm은 runner 임시 prefix에 따로 설치해 실행 중인 기본 npm을 덮어쓰지 않는다. npm ci --engine-strict로 실제 설치 시에도 engines를 검사한다. package.json의 기존 packageManager와 패키지 버전·의존성·lockfile은 변경하지 않았다.

checkout/setup-node/upload-artifact는 확인한 공식 Action의 전체 commit SHA로 고정했다.
GitHub 권한은 contents: read뿐이며 checkout 자격 증명을 작업 파일에 남기지 않는다.
별도 secret, 운영 environment, 지도/provider 키를 주입하지 않고 실제 VWorld/Geo/provider/Telegram을 호출하지 않는다.

## 실행 순서

1. 정확한 HEAD, Node/npm 버전과 packages/apps 트리 및 소스·lockfile SHA256을 기록한다.
2. 루트에서 npm ci --engine-strict를 실행한다.
3. 새 checkout에서 아직 없는 core/dist 타입을 npm run build -w packages/vworld-map-core로 준비한다.
4. 루트 npm run typecheck → npm run build → npm run lint → npm run test를 순서대로 실행한다. 현재 기존 RN 테스트는 21개다.
5. lockfile에 설치된 Playwright CLI로 Chromium과 Linux 시스템 의존성을 설치한다.
6. 기존 playwright.marker.config.ts와 marker-scale.spec.ts로 빈 스타일 마커 회귀 11개를 실행한다.
7. 위 HEAD에서 빌드한 core/web을 npm pack하고, 기존 fixture를 임시 소비 프로젝트에 복사해 tarball을 설치한 다음 동일한 회귀 11개를 다시 실행한다.

모든 shell 실행은 오류 및 pipe 실패를 전파한다. 타입/빌드/린트/테스트 실패를 tee가 숨기지 않는다.
공유 runner의 CPU 속도 차이만 고려해 브라우저 테스트별 제한은 60초로 두고 retry는 추가하지 않는다.
기존 실제 서비스 예제의 전체 e2e 대신 빈 스타일의 마커 spec만 선택한다. 이 spec은 localhost 이외의 브라우저 요청을 차단한다.

## Tarball 소비 검사 재현

별도 앱 구현이나 테스트 사본을 저장소에 추가하지 않는다.
workflow의 두 소비 검증 run 블록이 재현 가능한 준비·설치·검사 스크립트다.
CONSUMER_DIR 임시 디렉터리에 기존 marker-regression.tsx와 marker-regression.html을 복사하고 경로만 바꾼다.
기존 Playwright config를 import해 testDir는 같은 spec, baseURL/webServer는 임시 Vite 서버로 연결한다.

소비 프로젝트 peer 버전은 기존 별도 소비 검증과 같은 MapLibre 6.16.0 및 React/React DOM 19.2.7로 고정했다.
core/web은 방금 만든 file: tarball을 사용한다. npm install --ignore-scripts --engine-strict를 실행하며 생성된 소비 lockfile과 전체 의존성 트리를 artifact에 남긴다.
이 임시 설치에서 새로 해석하는 전이 의존성은 소비 lockfile로 확인한다. 저장소의 운영 의존성이나 lockfile을 갱신하는 작업은 아니다.

로컬에서 재실행하려면 정확한 PR SHA checkout 및 npm/Chromium 준비 후 workflow의 run 블록을 루트에서 순서대로 실행한다.
RUNNER_TEMP는 새 임시 디렉터리, GITHUB_WORKSPACE는 저장소 절대 경로, GITHUB_ENV는 임시 환경 기록 파일로 설정한다.
첫 run 블록이 기록한 CI_ARTIFACTS/CONSUMER_DIR를 후속 shell에도 전달한다.
GitHub에서는 이 값과 경로 전파를 runner가 처리한다.

## 결과와 인계

artifact 이름은 marker-ci-<검증 HEAD SHA>이며 성공/실패와 무관하게 수집하고 14일 보관한다.
다음 파일로 실행 결과를 확인한다.

- provenance.txt: HEAD SHA, Node/npm, packages/apps 트리, lockfile 및 Marker.tsx SHA256.
- npm-ci.log, core-bootstrap.log, typecheck.log, build.log, lint.log, test.log.
- marker-browser.log 및 marker-results/: 기존 11개 결과, SVG 끝점 실측과 화면.
- pack-core.json, pack-web.json, tarballs.sha256 및 tarballs/: 해당 HEAD의 설치 tarball.
- consumer-install.log, consumer-package-lock.json, consumer-tree.log.
- consumer-browser.log 및 consumer-results/: 설치된 tarball의 동일 브라우저 회귀 결과.

기존 zod 및 전체 의존성 감사 문제는 이번 CI 추가에서 갱신하거나 숨기지 않는다. 별도의 audit 성공을 이 job이 보증하지 않는다.
Firefox PR #30 변경, 마커 런타임 소스, 테스트/fixture/config 파일은 이번 추가 범위에서 바꾸지 않았다.
기준 3c3608bc106c55445c96625d81fcdeeda4838c67의 packages 트리는 9a8b4c40c9a6d327e0863fc660895c72415e69ce,
apps 트리는 69fd1027a9db07697b020bedc8f345c328f81bed이며 이번 workflow/문서 커밋에서도 동일해야 한다.
정확한 새 HEAD의 CI 성공 및 전문 독립 리뷰 2건 확인 후 ready/merge는 메인 담당자가 수행한다.

공식 동작은 [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node),
[Playwright CI 안내](https://playwright.dev/docs/ci-intro)를 참고했다.

## 최초 CI 실패 보완

f31e60d의 첫 GitHub 실행은 기본 npm이 자기 자신을 전역 갱신하는 중 Cannot find module 'promise-retry'로 실패했다.
워크플로 push 권한 실패는 아니며 checkout은 정확한 HEAD에서 성공했다.
npm 11.19.1을 runner 임시 prefix에 설치하고 PATH로 선택하도록 바꿔 실행 중인 기본 npm의 파일을 제거하지 않게 했다.
upload-artifact도 공식 v7.0.2 전체 SHA로 고정해 Node 20 Action의 강제 전환 경고를 없앴다.
