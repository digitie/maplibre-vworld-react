import React, { type ComponentProps } from 'react';
import { View } from 'react-native';
import { Marker as MapLibreMarker } from '@maplibre/maplibre-react-native';

type NativeMarkerProps = ComponentProps<typeof MapLibreMarker>;

/** Which part of the marker sits on `lngLat` (native default: `center`). */
export type MarkerAnchor = NonNullable<NativeMarkerProps['anchor']>;

export interface MarkerProps {
  id: string;
  lngLat: [number, number];
  /**
   * Which part of the marker is placed on `lngLat`. Card / bubble markers use
   * `bottom` so they sit above the point instead of covering it (parity with
   * the web `anchor` option). Omit for the native default (`center`).
   */
  anchor?: MarkerAnchor;
  /** Pixel offset `[x, y]` from the anchor (negative y moves the marker up). */
  offset?: NativeMarkerProps['offset'];
  /** Fired when the marker is pressed. */
  onPress?: () => void;
  /**
   * @deprecated Use `onPress`. Kept as an alias for backwards compatibility;
   * React Native and the underlying MapLibre Marker use `onPress`.
   */
  onClick?: () => void;
  /** Built-in pin color. Ignored when `children` is provided. @default 'red' */
  color?: string;
  /** Visual selected state for the built-in pin (larger, white ring). */
  selected?: boolean;
  /** Visual highlighted state (softer emphasis than selected). */
  highlighted?: boolean;
  /** Stacking order among markers (passed to the marker view's zIndex). */
  zIndex?: number;
  /** Accessibility label; also marks the marker as an accessible button. */
  ariaLabel?: string;
  children?: React.ReactElement;
}

export const Marker: React.FC<MarkerProps> = ({
  id,
  lngLat,
  anchor,
  offset,
  onPress,
  onClick,
  color = 'red',
  selected = false,
  highlighted = false,
  zIndex,
  ariaLabel,
  children,
}) => {
  const handlePress = onPress ?? onClick;
  // selected / highlighted change size + ring but keep the consumer's color
  // (parity with the web Marker, which keeps color and adds scale/shadow).
  const size = selected ? 28 : highlighted ? 24 : 20;
  const borderWidth = selected ? 3 : highlighted ? 2 : 0;
  const content: React.ReactElement = children ?? (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        borderWidth,
        borderColor: 'white',
      }}
    />
  );

  return (
    <MapLibreMarker
      id={id}
      lngLat={lngLat}
      anchor={anchor}
      offset={offset}
      onPress={handlePress}
      style={zIndex !== undefined ? { zIndex } : undefined}
      accessible={ariaLabel ? true : undefined}
      accessibilityRole={ariaLabel ? 'button' : undefined}
      accessibilityLabel={ariaLabel}
    >
      {content}
    </MapLibreMarker>
  );
};
