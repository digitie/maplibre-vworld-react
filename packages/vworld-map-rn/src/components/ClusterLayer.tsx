import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

export interface ClusterLayerProps {
  id: string;
  data: GeoJSON.FeatureCollection<GeoJSON.Point>;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  /** Fill color of an unclustered point. @default '#e53935' */
  pointColor?: string;
  /** Radius (px) of an unclustered point. @default 6 */
  pointRadius?: number;
}

export const ClusterLayer: React.FC<ClusterLayerProps> = ({
  id,
  data,
  clusterRadius = 50,
  clusterMaxZoom = 14,
  pointColor = '#e53935',
  pointRadius = 6,
}) => {
  return (
    <GeoJSONSource
      id={`${id}-source`}
      data={data as any}
      cluster={true}
      clusterRadius={clusterRadius}
      clusterMaxZoom={clusterMaxZoom}
    >
      {/* Unclustered points: a circle layer (no icon registration required, so
          the points actually render — the old `icon-image: 'pin-red'` referenced
          an image that was never added via `Images`). */}
      <Layer
        id={`${id}-point`}
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': pointColor,
          'circle-radius': pointRadius,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        }}
      />
      <Layer
        id={`${id}-cluster`}
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ],
          'circle-opacity': 0.8
        }}
      />
      <Layer
        id={`${id}-cluster-count`}
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-allow-overlap': true,
        }}
        paint={{
          'text-color': '#ffffff',
        }}
      />
    </GeoJSONSource>
  );
};
