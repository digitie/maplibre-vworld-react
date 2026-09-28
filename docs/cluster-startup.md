# 최초 묶음 마커 초기화

`map.loaded()`는 최초 `load` 이벤트 이력과 다르다. 초기 로딩 후 타일·스타일 갱신 중
다시 `false`가 될 수 있다. 이 시점에 `ClusterLayer`가 mount되면 이미 끝난 일회성
`load`를 기다려 지도 이동 전까지 초기 viewport를 얻지 못했다.

기존 `useMapLoaded()`의 최초 로드 상태를 구독하고, 참이 되면 bounds·zoom을 즉시
갱신한다. 이후 moveend·zoomend 구독과 unmount 정리는 유지한다.

`apps/web-example/cluster-regression.html`은 정상 최초 mount와 load 이후 mount를
검증하는 전용 fixture다. 후자는 500ms 동안 `loaded()`만 거짓으로 만들어 타일 갱신
상태를 결정적으로 재현한다. 테스트는 실제 지도와 정상 PNG 타일을 사용하며 지도 이동이나
재시도 없이 최초 묶음 표시를 확인한다. React Native 코드는 변경하지 않는다.
