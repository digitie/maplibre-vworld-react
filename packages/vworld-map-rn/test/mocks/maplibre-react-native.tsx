import React from 'react';

const host =
  (name: string) =>
  ({ children, ...props }: any) =>
    React.createElement(name, props, children);

/** Shared spies for the Camera imperative API, asserted by tests. */
export const __cameraSpies = {
  flyTo: jest.fn(),
  fitBounds: jest.fn(),
  zoomTo: jest.fn(),
  jumpTo: jest.fn(),
  easeTo: jest.fn(),
};

export const Map = host('Map');
export const Marker = host('Marker');
export const GeoJSONSource = host('GeoJSONSource');
export const Layer = host('Layer');

export const Camera = React.forwardRef((props: any, ref: any) => {
  React.useImperativeHandle(ref, () => __cameraSpies, []);
  const { children, ...rest } = props;
  return React.createElement('Camera', rest, children);
});
Camera.displayName = 'Camera';
