/**
 * Web adapter parity for the RN package (vworld-map-web #31·#32·#33 audit).
 *
 * - fitBounds `paddingPx` — the handle accepted it but never forwarded it.
 * - Marker `anchor` / `offset` — card-style markers (PlaceMarker, Popup) were
 *   centered on the coordinate and covered it; web anchors them at `bottom`.
 * - explicit `mapStyle` — web #32 lets an explicit style replace the VWorld
 *   style (keyless local geometry); RN always built the VWorld style.
 */
import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { VWorldMapView, type VWorldMapHandle } from '../src/VWorldMapView';
import { Marker } from '../src/components/Marker';
import { PlaceMarker } from '../src/components/PlaceMarker';
import { Popup } from '../src/components/Popup';
import { PriceMarker } from '../src/components/PriceMarker';
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

describe('fitBounds padding', () => {
  it('forwards paddingPx to the native camera on every side', () => {
    const ref = React.createRef<VWorldMapHandle>();
    create(<VWorldMapView ref={ref} apiKey="k" />);
    act(() => ref.current!.fitBounds({ sw: [126, 36], ne: [128, 38] }, { paddingPx: 40, durationMs: 300 }));
    expect(__cameraSpies.fitBounds).toHaveBeenCalledWith([126, 36, 128, 38], {
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      duration: 300,
    });
  });

  it('accepts per-side padding (e.g. a bottom sheet) and fills missing sides with 0', () => {
    const ref = React.createRef<VWorldMapHandle>();
    create(<VWorldMapView ref={ref} apiKey="k" />);
    act(() => ref.current!.fitBounds({ sw: [126, 36], ne: [128, 38] }, { paddingPx: { top: 96, bottom: 320 } }));
    expect(__cameraSpies.fitBounds).toHaveBeenCalledWith([126, 36, 128, 38], {
      padding: { top: 96, right: 0, bottom: 320, left: 0 },
    });
  });

  it('sends no padding when none is requested (unchanged default)', () => {
    const ref = React.createRef<VWorldMapHandle>();
    create(<VWorldMapView ref={ref} apiKey="k" />);
    act(() => ref.current!.fitBounds({ sw: [126, 36], ne: [128, 38] }));
    expect(__cameraSpies.fitBounds).toHaveBeenCalledWith([126, 36, 128, 38], {});
  });
});

describe('marker anchoring', () => {
  it('Marker forwards anchor and offset to the native marker', () => {
    const r = create(<Marker id="m" lngLat={[127, 37]} anchor="bottom" offset={[0, -8]} />);
    const native = hosts(r, 'Marker')[0];
    expect(native.props.anchor).toBe('bottom');
    expect(native.props.offset).toEqual([0, -8]);
  });

  it('Marker keeps the native default (center, no offset) when not given', () => {
    const r = create(<Marker id="m" lngLat={[127, 37]} />);
    const native = hosts(r, 'Marker')[0];
    expect(native.props.anchor).toBeUndefined();
    expect(native.props.offset).toBeUndefined();
  });

  it('PlaceMarker sits above the coordinate like web (bottom anchor, [0,-8] offset)', () => {
    const r = create(<PlaceMarker id="p" lngLat={[127, 37]} title="경복궁" />);
    const native = hosts(r, 'Marker')[0];
    expect(native.props.anchor).toBe('bottom');
    expect(native.props.offset).toEqual([0, -8]);
  });

  it('Popup bubble sits above the coordinate instead of covering it', () => {
    const r = create(
      <Popup lngLat={[127, 37]}>
        <Text>hi</Text>
      </Popup>,
    );
    expect(hosts(r, 'Marker')[0].props.anchor).toBe('bottom');
  });

  it('chip markers stay centered like web (PriceMarker)', () => {
    const r = create(<PriceMarker id="c" lngLat={[127, 37]} price={10000} />);
    expect(hosts(r, 'Marker')[0].props.anchor).toBeUndefined();
  });
});

describe('explicit mapStyle (web #32 keyless contract)', () => {
  const LOCAL_STYLE = {
    version: 8 as const,
    sources: { local: { type: 'geojson' as const, data: { type: 'FeatureCollection' as const, features: [] } } },
    layers: [{ id: 'bg', type: 'background' as const, paint: { 'background-color': '#eee' } }],
  };

  it('uses the explicit style as-is, without a VWorld key or VWorld tiles', () => {
    const r = create(<VWorldMapView apiKey="" mapStyle={LOCAL_STYLE} />);
    expect(hosts(r, 'Map')[0].props.mapStyle).toBe(LOCAL_STYLE);
  });

  it('accepts a style URL string', () => {
    const r = create(<VWorldMapView apiKey="" mapStyle="https://tiles.test/style.json" />);
    expect(hosts(r, 'Map')[0].props.mapStyle).toBe('https://tiles.test/style.json');
  });

  it('does not clamp maxZoom to the VWorld layer max for an explicit style', () => {
    const r = create(<VWorldMapView apiKey="" mapType="satellite" maxZoom={21} mapStyle={LOCAL_STYLE} />);
    expect(hosts(r, 'Camera')[0].props.maxZoom).toBe(21);
  });

  it('keeps the VWorld style and layer clamp when no mapStyle is given', () => {
    const r = create(<VWorldMapView apiKey="k" mapType="satellite" maxZoom={21} />);
    expect(hosts(r, 'Map')[0].props.mapStyle.sources['vworld-base'].tiles[0]).toContain('api.vworld.kr');
    expect(hosts(r, 'Camera')[0].props.maxZoom).toBe(18);
  });
});
