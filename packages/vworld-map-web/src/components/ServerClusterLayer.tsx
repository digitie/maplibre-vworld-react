'use client';

import React, { useCallback } from 'react';
import type maplibregl from 'maplibre-gl';
import { type Bounds } from '../schemas';
import { ClusterMarker } from './ClusterMarker';
import { useMap } from '../store/hooks';

export interface ServerClusterPoint {
  id: string | number;
  lngLat: [number, number];
  count: number;
  label?: string;
  bounds?: Bounds;
  zoomTo?: number;
  color?: string;
  size?: number;
  [key: string]: unknown;
}

export interface ServerClusterLayerProps {
  clusters: ServerClusterPoint[];
  renderCluster?: (cluster: ServerClusterPoint, onClick: () => void) => React.ReactNode;
  onClusterClick?: (cluster: ServerClusterPoint) => void;
  fitBoundsOptions?: Omit<maplibregl.FitBoundsOptions, 'linear'>;
  flyToOptions?: Omit<maplibregl.FlyToOptions, 'center' | 'zoom'>;
}

function boundsToLngLatBoundsLike(bounds: Bounds): maplibregl.LngLatBoundsLike {
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
}

export const ServerClusterLayer: React.FC<ServerClusterLayerProps> = ({
  clusters,
  renderCluster,
  onClusterClick,
  fitBoundsOptions,
  flyToOptions,
}) => {
  const map = useMap();
  const handleClusterClick = useCallback((cluster: ServerClusterPoint) => {
    if (!map) return;
    onClusterClick?.(cluster);
    if (cluster.bounds) {
      map.fitBounds(boundsToLngLatBoundsLike(cluster.bounds), {
        padding: 48,
        maxZoom: cluster.zoomTo,
        ...fitBoundsOptions,
      });
      return;
    }
    map.flyTo({
      ...flyToOptions,
      center: cluster.lngLat,
      zoom: cluster.zoomTo ?? Math.min(map.getZoom() + 2, 18),
    });
  }, [fitBoundsOptions, flyToOptions, map, onClusterClick]);

  if (!map) return null;

  return (
    <>
      {clusters.map((cluster) => {
        const onClick = () => handleClusterClick(cluster);
        if (renderCluster) {
          return (
            <React.Fragment key={cluster.id}>
              {renderCluster(cluster, onClick)}
            </React.Fragment>
          );
        }
        return (
          <ClusterMarker
            key={cluster.id}
            lngLat={cluster.lngLat}
            count={cluster.count}
            color={cluster.color}
            size={cluster.size}
            ariaLabel={cluster.label ?? `Cluster with ${cluster.count} items`}
            onClick={onClick}
          />
        );
      })}
    </>
  );
};
