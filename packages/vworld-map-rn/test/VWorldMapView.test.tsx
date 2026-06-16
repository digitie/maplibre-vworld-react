import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { VWorldMapView, type VWorldMapHandle } from '../src/VWorldMapView';
import { __cameraSpies } from './mocks/maplibre-react-native';

function create(el: React.ReactElement): TestRenderer.ReactTestRenderer {
  let r: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r!;
}
const hosts = (r: TestRenderer.ReactTestRenderer, type: string) =>
  r.root.findAll((n) => n.type === type);

beforeEach(() => jest.clearAllMocks());

describe('RN VWorldMapView', () => {
  it('renders a Map + Camera and one Marker per markers item', () => {
    const r = create(
      <VWorldMapView
        apiKey="k"
        markers={[
          { id: 'a', coordinate: [127, 37], title: 'A' },
          { id: 'b', coordinate: [128, 38], title: 'B' },
        ]}
      />,
    );
    expect(hosts(r, 'Map')).toHaveLength(1);
    expect(hosts(r, 'Camera')).toHaveLength(1);
    expect(hosts(r, 'Marker')).toHaveLength(2);
  });

  it('marks the selectedFeatureId marker as selected', () => {
    const r = create(
      <VWorldMapView
        apiKey="k"
        selectedFeatureId="b"
        markers={[
          { id: 'a', coordinate: [127, 37] },
          { id: 'b', coordinate: [128, 38] },
        ]}
      />,
    );
    // selected pin gets a border ring; unselected does not
    const pins = hosts(r, 'View').filter((v) => v.props.style && 'backgroundColor' in v.props.style);
    const ringed = pins.filter((v) => v.props.style.borderWidth > 0);
    expect(ringed).toHaveLength(1);
  });

  it('wires the native press event to onMapPress', () => {
    const onMapPress = jest.fn();
    const r = create(<VWorldMapView apiKey="k" onMapPress={onMapPress} />);
    act(() => hosts(r, 'Map')[0].props.onPress({ nativeEvent: { lngLat: [127.5, 37.5] } }));
    expect(onMapPress).toHaveBeenCalledWith([127.5, 37.5]);
  });

  it('maps the v11 region-change payload to onCameraChanged', () => {
    const onCameraChanged = jest.fn();
    const r = create(<VWorldMapView apiKey="k" onCameraChanged={onCameraChanged} />);
    act(() =>
      hosts(r, 'Map')[0].props.onRegionDidChange({
        nativeEvent: { center: [127, 37], zoom: 12, pitch: 0, bearing: 30, bounds: [126, 36, 128, 38] },
      }),
    );
    expect(onCameraChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [127, 37],
        zoom: 12,
        heading: 30,
        bounds: { sw: [126, 36], ne: [128, 38] },
      }),
    );
  });

  it('exposes an imperative camera handle (flyTo / fitBounds / zoomTo)', () => {
    const ref = React.createRef<VWorldMapHandle>();
    create(<VWorldMapView ref={ref} apiKey="k" />);
    act(() => ref.current!.flyTo({ center: [127, 37], zoom: 15 }));
    expect(__cameraSpies.flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [127, 37], zoom: 15 }));
    act(() => ref.current!.fitBounds({ sw: [126, 36], ne: [128, 38] }));
    expect(__cameraSpies.fitBounds).toHaveBeenCalledWith([126, 36, 128, 38], expect.any(Object));
    act(() => ref.current!.zoomTo(10));
    expect(__cameraSpies.zoomTo).toHaveBeenCalledWith(10, undefined);
  });

  it('routes tile URLs through tileUrlTransform (proxy / no bundled key)', () => {
    const r = create(
      <VWorldMapView
        apiKey="dummy"
        tileUrlTransform={(u) => u.replace('https://api.vworld.kr', 'https://proxy.test')}
      />,
    );
    const tiles = hosts(r, 'Map')[0].props.mapStyle.sources['vworld-base'].tiles as string[];
    expect(tiles[0]).toContain('https://proxy.test');
    expect(tiles[0]).not.toContain('api.vworld.kr');
  });

  it('fires onError on native load failure', () => {
    const onError = jest.fn();
    const r = create(<VWorldMapView apiKey="k" onError={onError} />);
    act(() => hosts(r, 'Map')[0].props.onDidFailLoadingMap());
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
