import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Popup } from '../src/components/Popup';
import { PriceMarker } from '../src/components/PriceMarker';
import { WeatherMarker } from '../src/components/WeatherMarker';
import { PlaceMarker } from '../src/components/PlaceMarker';
import { ClusterLayer } from '../src/components/ClusterLayer';
import { RouteLine } from '../src/components/RouteLine';
import { PolygonArea } from '../src/components/PolygonArea';

function create(el: React.ReactElement): TestRenderer.ReactTestRenderer {
  let r: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r!;
}
const hosts = (r: TestRenderer.ReactTestRenderer, type: string) =>
  r.root.findAll((n) => n.type === type);

/** Concatenate every string leaf in a react-test-renderer JSON tree. */
function allText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(allText).join('');
  return allText(node.children);
}

describe('RN primitives (#5/#6)', () => {
  it('PriceMarker renders a single price with currency', () => {
    const r = create(<PriceMarker id="p" lngLat={[0, 0]} price={12000} currency="₩" />);
    expect(allText(r.toJSON())).toMatch(/₩12[,]?000/);
  });

  it('PriceMarker renders a multi-item list', () => {
    const r = create(
      <PriceMarker
        id="p"
        lngLat={[0, 0]}
        price={[
          { label: '휘발유', price: '1700' },
          { label: '경유', price: '1500' },
        ]}
        currency="₩"
      />,
    );
    const t = allText(r.toJSON());
    expect(t).toContain('휘발유');
    expect(t).toContain('₩1700');
    expect(t).toContain('경유');
  });

  it('WeatherMarker renders rounded temperature + unit', () => {
    const r = create(<WeatherMarker id="w" lngLat={[0, 0]} temperature={23.6} condition="sunny" />);
    expect(allText(r.toJSON())).toContain('24°C');
  });

  it('PlaceMarker renders title / category / description', () => {
    const r = create(
      <PlaceMarker id="pl" lngLat={[0, 0]} title="경복궁" category="명소" description="조선 궁궐" />,
    );
    const t = allText(r.toJSON());
    expect(t).toContain('경복궁');
    expect(t).toContain('명소');
    expect(t).toContain('조선 궁궐');
  });

  it('Popup renders a close button that fires onClose', () => {
    const onClose = jest.fn();
    const r = create(
      <Popup id="pp" lngLat={[0, 0]} onClose={onClose}>
        <></>
      </Popup>,
    );
    act(() => hosts(r, 'TouchableOpacity')[0].props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ClusterLayer renders unclustered points as a circle layer (no pin-red icon)', () => {
    const r = create(<ClusterLayer id="c" data={{ type: 'FeatureCollection', features: [] }} />);
    const pointLayer = hosts(r, 'Layer').find((l) => l.props.id === 'c-point');
    expect(pointLayer).toBeTruthy();
    expect(pointLayer!.props.type).toBe('circle');
  });

  it('RouteLine renders a GeoJSONSource + line Layer', () => {
    const r = create(<RouteLine id="r" coordinates={[[0, 0], [1, 1]]} />);
    expect(hosts(r, 'GeoJSONSource')).toHaveLength(1);
    expect(hosts(r, 'Layer')[0].props.type).toBe('line');
  });

  it('PolygonArea renders fill + line layers', () => {
    const r = create(<PolygonArea id="pa" coordinates={[[[0, 0], [1, 0], [1, 1], [0, 0]]]} />);
    const types = hosts(r, 'Layer').map((l) => l.props.type);
    expect(types).toContain('fill');
    expect(types).toContain('line');
  });
});
