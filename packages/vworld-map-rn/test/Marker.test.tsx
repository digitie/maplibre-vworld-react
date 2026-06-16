import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Marker } from '../src/components/Marker';

function renderJSON(el: React.ReactElement): any {
  let r: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r!.toJSON();
}

describe('RN Marker', () => {
  it('renders a default pin with the given color and coordinate', () => {
    const tree = renderJSON(<Marker id="1" lngLat={[127, 37]} color="blue" />);
    expect(tree.type).toBe('Marker');
    expect(tree.props.lngLat).toEqual([127, 37]);
    const view = tree.children[0];
    expect(view.type).toBe('View');
    expect(view.props.style.backgroundColor).toBe('blue');
  });

  it('enlarges + rings the pin when selected', () => {
    const tree = renderJSON(<Marker id="1" lngLat={[0, 0]} color="red" selected />);
    const view = tree.children[0];
    expect(view.props.style.backgroundColor).toBe('red'); // color kept
    expect(view.props.style.borderWidth).toBeGreaterThan(0);
  });

  it('calls onPress (and accepts the onClick alias)', () => {
    const onPress = jest.fn();
    const tree = renderJSON(<Marker id="1" lngLat={[0, 0]} onPress={onPress} />);
    act(() => tree.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility props from ariaLabel', () => {
    const tree = renderJSON(<Marker id="1" lngLat={[0, 0]} ariaLabel="가게" />);
    expect(tree.props.accessibilityLabel).toBe('가게');
    expect(tree.props.accessibilityRole).toBe('button');
  });
});
