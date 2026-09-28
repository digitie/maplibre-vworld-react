# 최초 묶음 마커 초기화

`map.loaded()`는 최초 `load` 이벤트 이력과 다르다. 초기 로딩 후 타일·스타일 갱신 중
다시 `false`가 될 수 있다. 이 시점에 `ClusterLayer`가 mount되면 이미 끝난 일회성
`load`를 기다려 지도 이동 전까지 초기 viewport를 얻지 못했다.

기존 `useMapLoaded()`의 최초 로드 상태를 구독하고, 참이 되면 bounds·zoom을 즉시
갱신한다. 이후 moveend·zoomend 구독과 unmount 정리는 유지한다.

`apps/web-example/cluster-regression.html`은 정상 최초 mount와 load 이후 mount를
검증하는 전용 fixture다. 후자는 묶음 표시를 확인한 뒤 버튼을 누를 때까지 `loaded()`만
거짓으로 만들어 타일 갱신 상태를 결정적으로 재현한다. 테스트는 실제 지도와 정상 PNG 타일을 사용하며 지도 이동이나
재시도 없이 최초 묶음 표시를 확인한다. React Native 코드는 변경하지 않는다.

WSL에서 수정 전 두 경우 모두 실패했고 수정 후 전체 웹 E2E 5개가 통과했다.
core/web 타입 검사·빌드, web-example 빌드·린트도 통과했다(기존 Hook 린트 경고 13개).
James/Popper 독립 리뷰에서 새 P0/P1/P2는 없었으며 Popper의 시간 의존 fixture
보강 제안은 명시적 복원 버튼으로 반영했다. 이 저장소에는 GitHub Actions 검사가 없다.
