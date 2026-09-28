import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClusterLayer, Marker, VWorldMapView } from 'vworld-map-web';

const points = [1, 2, 3].map((id) => ({ id, lngLat: [126.978, 37.5665] as [number, number] }));
const late = new URLSearchParams(location.search).has('late');

export default function Fixture() {
  const [ready, setReady] = useState(!late);
  return <VWorldMapView apiKey="e2e-dummy-key" center={[126.978, 37.5665]} zoom={12}
    style={{ width: '100vw', height: '100vh' }}
    onLoad={(map) => {
      if (!late) return;
      // 초기 load 이후 타일 갱신 때문에 loaded()만 false인 상황을 결정적으로 재현한다.
      const loaded = map.loaded.bind(map);
      map.loaded = () => false;
      setReady(true);
      setTimeout(() => { map.loaded = loaded; }, 500);
    }}>
    {ready ? <ClusterLayer points={points} renderMarker={(point) => <Marker lngLat={point.lngLat}>장소</Marker>} /> : null}
  </VWorldMapView>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);
