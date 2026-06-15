import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

export interface RouteLineProps {
  id: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
}

export const RouteLine: React.FC<RouteLineProps> = ({ id, coordinates, color = '#2196F3', width = 4 }) => {
  const shape: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates
    }
  };

  return (
    <GeoJSONSource id={`${id}-source`} data={shape as any}>
      <Layer
        id={`${id}-layer`}
        type="line"
        paint={{
          'line-color': color,
          'line-width': width,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </GeoJSONSource>
  );
};
