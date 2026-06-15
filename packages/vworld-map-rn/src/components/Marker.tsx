import React from 'react';
import { View } from 'react-native';
import { Marker as MapLibreMarker } from '@maplibre/maplibre-react-native';

export interface MarkerProps {
  id: string;
  lngLat: [number, number];
  /** Fired when the marker is pressed. */
  onPress?: () => void;
  /**
   * @deprecated Use `onPress`. Kept as an alias for backwards compatibility;
   * React Native and the underlying MapLibre Marker use `onPress`.
   */
  onClick?: () => void;
  /** Visual selected state for the built-in pin (larger, accent color). */
  selected?: boolean;
  children?: React.ReactElement;
}

export const Marker: React.FC<MarkerProps> = ({
  id,
  lngLat,
  onPress,
  onClick,
  selected = false,
  children,
}) => {
  const handlePress = onPress ?? onClick;
  const size = selected ? 28 : 20;
  const content: React.ReactElement = children ?? (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: selected ? '#1A73E8' : 'red',
        borderRadius: size / 2,
        borderWidth: selected ? 3 : 0,
        borderColor: 'white',
      }}
    />
  );

  return (
    <MapLibreMarker id={id} lngLat={lngLat} onPress={handlePress}>
      {content}
    </MapLibreMarker>
  );
};
