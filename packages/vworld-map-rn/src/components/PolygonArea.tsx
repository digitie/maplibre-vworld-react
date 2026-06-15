import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

export interface PolygonAreaProps {
  id: string;
  coordinates: [number, number][][];
  fillColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
}

export const PolygonArea: React.FC<PolygonAreaProps> = ({ 
  id, 
  coordinates, 
  fillColor = 'rgba(33, 150, 243, 0.4)', 
  outlineColor = '#2196F3', 
  outlineWidth = 2 
}) => {
  const shape: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates
    }
  };

  return (
    <GeoJSONSource id={`${id}-source`} data={shape as any}>
      <Layer
        id={`${id}-fill`}
        type="fill"
        paint={{
          'fill-color': fillColor,
        }}
      />
      <Layer
        id={`${id}-outline`}
        type="line"
        paint={{
          'line-color': outlineColor,
          'line-width': outlineWidth,
        }}
      />
    </GeoJSONSource>
  );
};
