# 전문 리뷰 P2 두 건 보완

## 정확한 비교 기준

실제 origin/main은 fb754755871ca8318907327c9a7d096dd96b1278이다.
3c09359는 미병합 PR #30의 head이며 main이 아니다. URL helper 삭제/rollback이라는 지적은 잘못된 비교 기준에 따른 것으로 철회됐다.
PR #30은 OPEN/미병합 상태로 보존하고 해당 브랜치 merge/cherry-pick, vworld.ts/helper/test/script 변경을 이번 수정에 섞지 않는다.

실패 우선 검사는 8ccbe7a6276907d27755f522a0ed19ff11f79e55의 Marker.tsx를 그대로 두고 기존 fixture/spec에 회귀만 추가해 수행했다.
마커 기준 SHA256은 a2d8a290f4299389f529fe35722e1dfdfdcb69d92334cc696f4175c899deecdb다.

## 동적 offset과 확대 원점

기본 center Marker의 offset을 미지정에서 [13,-9]로 바꾸면 setOffset만 실행되고 SVG 확대 원점은 기본 offset 보정값에 남았다.
같은 카메라/좌표/선택 상태에서 동적으로 갱신한 마커와 처음부터 explicit offset으로 만든 새 마커의 실제 SVG 경로 끝점을 비교했다.
수정 전 selected에서는 y가 -2.52px, highlighted에서는 -1.40px 차이 나며 두 테스트가 실패했다. transform 문자열로 판정하지 않았다.

offset setter와 기본 SVG 확대 원점을 같은 effect에서 갱신하도록 옮겼다.
미지정 offset으로 돌아올 때는 생성자 기본값(기본 핀 [0,-14], custom [0,0])도 복원한다.
마커 생성 조건이 바뀐 경우에도 setter/원점을 다시 적용한다.
selected/highlighted 양쪽에서 미지정 → [13,-9] → [0,0] → 미지정 전환을 새 마커와 비교하고, 기존 root 동일성을 유지하며 끝점 차이 0.1px 미만을 확인했다.

## 재사용 custom 컨테이너의 이전 class

custom Marker children의 root는 color/draggable 때문에 네이티브 마커를 재생성해도 재사용한다.
prevClassNameRef만 undefined로 초기화하면 이전 className 토큰을 제거할 근거가 사라져 old→new/undefined 전환에서 토큰이 남았다.
수정 전 color/draggable × new/undefined의 실제 브라우저 4개가 모두 실패했다.
PinMarker의 color는 내부 SVG 전용이므로 color 재생성 회귀에는 Marker children의 일반 custom SVG fixture를 사용했다.

기존 마커 cleanup에서 이 컴포넌트가 추가한 className 토큰만 제거한 뒤 다음 인스턴스의 class diff를 초기화한다.
MapLibre 클래스와 외부에서 붙인 consumer-owned 클래스는 보존한다.
새 공통 토큰 유지, 이전 토큰 제거, className 미지정, root 동일성, ARIA/focus/Enter 동작까지 4개 모두 통과했다.

## 검증과 인계

WSL Chromium/WebGL2의 빈 스타일에서 두 지적의 회귀 6개가 수정 전 실패, 수정 후 통과했다.
외부 브라우저 요청을 차단하고 실제 provider/prod/secret을 사용하지 않았다.
루트 typecheck/build/lint 및 기존 RN 테스트 21개도 보완 후 통과했다.
기존 마커 회귀 11개에 이번 6개를 더해 workflow는 17개를 실행하고 설치한 tarball에서도 동일 17개를 실행한다.
실제 새 HEAD의 GitHub CI 상태는 PR #31의 Marker CI check와 HEAD별 artifact로 확인한다. 이전 HEAD 성공은 대체 증거가 아니다.
ready/merge는 메인 담당자가 전문 리뷰 2건과 정확 HEAD 성공을 확인한 후 수행한다.

수치·토큰 목록·수정 전후 소스 SHA256은 [실측 자료](marker-review-p2-evidence.json)에 기록했다.
WSL 로그/화면은 /home/digitie/vworld-workspaces/623-evidence/p2-before-browser.log,
p2-before-results/, p2-after-browser.log, p2-after-results/에 남겼다.
기존 1.0.2 검증 tarball은 이번 P2가 없으므로 그대로 다음 pin에 사용하지 않는다.
새 HEAD에서 build/pack한 web 1.0.2의 새 SHA256 및 소비 17개 결과를 확인한 다음 pin해야 한다.
core/패키지 버전/의존성/lockfile 및 미병합 PR #30은 이 P2 보완에서 바꾸지 않았다.
