import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Map as LibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapStore, MapStoreContext, Marker, PinMarker, type MarkerAnchor } from 'vworld-map-web';

const map = new LibreMap({
  container: 'map', style: { version: 8, sources: {}, layers: [] },
  center: [127, 37.5], zoom: 10, bearing: 0, pitch: 0,
  interactive: false, attributionControl: false,
});
const store = new MapStore();
store.setMap(map);
const coordinates = [[80, 100], [780, 540]].map((point) => map.unproject(point as [number, number]).toArray());
const params = new URLSearchParams(location.search);
const custom = params.has('custom');
const shape = params.has('shape');
const anchor = (params.get('anchor') ?? 'center') as MarkerAnchor;
const offset: [number, number] = params.has('offset') ? [13, -9] : [0, 0];
const anchorPoints = {
  center: [0.5, 0.5], top: [0.5, 0], bottom: [0.5, 1], left: [0, 0.5], right: [1, 0.5],
  'top-left': [0, 0], 'top-right': [1, 0], 'bottom-left': [0, 1], 'bottom-right': [1, 1],
};
const events: unknown[] = [];

declare global {
  interface Window {
    markerProbe: {
      map: LibreMap;
      coordinates: [number, number][];
      events: unknown[];
      sample: () => unknown[];
    };
  }
}
window.markerProbe = {
  map, coordinates, events,
  sample: () => Array.from(document.querySelectorAll<HTMLElement>('.maplibregl-marker')).map((root, i) => {
    // 외곽 핀 경로의 최하단을 직접 찾는다. 텍스트/범례/transform 문자열은 측정하지 않는다.
    const path = root.querySelector<SVGPathElement>((custom || shape) ? 'svg > path' : 'svg > g > g:nth-child(2) > path')!;
    const length = path.getTotalLength();
    let tip = path.getPointAtLength(0);
    for (let step = 1; step <= 10000; step++) {
      const point = path.getPointAtLength(length * step / 10000);
      if (point.y > tip.y) tip = point;
    }
    if (shape) {
      const box = path.getBBox();
      const [x, y] = anchorPoints[anchor];
      tip = new DOMPoint(box.x + box.width * x, box.y + box.height * y);
    }
    const screen = new DOMPoint(tip.x, tip.y).matrixTransform(path.getScreenCTM()!);
    const projected = map.project(coordinates[i]);
    if (shape) { projected.x += offset[0]; projected.y += offset[1]; }
    const rect = map.getContainer().getBoundingClientRect();
    return {
      i, coordinate: coordinates[i], camera: [map.getCenter().toArray(), map.getZoom(), map.getBearing(), map.getPitch()],
      tip: [screen.x - rect.left, screen.y - rect.top], projected: [projected.x, projected.y],
      error: [screen.x - rect.left - projected.x, screen.y - rect.top - projected.y],
      path: path.getAttribute('d'), color: path.getAttribute('fill') ?? path.parentElement?.getAttribute('fill'),
      selected: root.dataset.selected, highlighted: root.dataset.highlighted,
      webgl: !!map.getCanvas().getContext('webgl2'),
    };
  }),
};

export default function Fixture() {
  const [state, setState] = useState('false');
  const [color, setColor] = useState('#DB4437');
  const [visible, setVisible] = useState(true);
  const [dynamicOffset, setDynamicOffset] = useState<[number, number] | undefined>(
    params.get('initial-offset') === 'explicit' ? [13, -9]
      : params.get('initial-offset') === 'zero' ? [0, 0] : undefined,
  );
  const [markerClass, setMarkerClass] = useState<string | undefined>('probe-marker shared-token');
  const [draggable, setDraggable] = useState(true);
  const Component = custom ? PinMarker : Marker;
  return <><MapStoreContext.Provider value={store}>
    {visible && coordinates.map((lngLat, i) => <Component key={i} lngLat={lngLat} color={color} offset={dynamicOffset}
      {...(shape ? { anchor, offset, children: <svg width="40" height="60" viewBox="0 0 40 60" style={{ display: 'block' }}><path fill={color} d="M0 0H40V60H0Z" /></svg> } : {})}
      selected={state === 'selected'} highlighted={state === 'highlighted'} draggable={draggable}
      ariaLabel={`검증 마커 ${i}`} interactionId={`probe-${i}`} className={markerClass}
      onClick={(_event, context, marker) => events.push({ type: 'click', context, sameRoot: marker.getElement().classList.contains('probe-marker') })}
      onContextMenu={(_event, context) => events.push({ type: 'contextmenu', context })}
      onDragEnd={(lngLat) => events.push({ type: 'dragend', lngLat })}
    />)}
  </MapStoreContext.Provider>
    {['false', 'selected', 'highlighted'].map((value) => <button key={value} onClick={() => setState(value)}>{value}</button>)}
    <button onClick={() => setColor('#8844CC')}>색상 변경</button>
    <button onClick={() => setVisible(!visible)}>마커 토글</button>
    <button onClick={() => setDynamicOffset([13, -9])}>offset 설정</button>
    <button onClick={() => setDynamicOffset([0, 0])}>offset 영점</button>
    <button onClick={() => setDynamicOffset(undefined)}>offset 기본값</button>
    {['color', 'draggable'].flatMap((property) => ['new', 'undefined'].map((next) =>
      <button key={property + next} onClick={() => {
        setMarkerClass(next === 'new' ? 'probe-next shared-token' : undefined);
        if (property === 'color') setColor('#8844CC');
        else setDraggable(false);
      }}>{`class ${property} ${next}`}</button>))}

  </>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); map.remove(); });
