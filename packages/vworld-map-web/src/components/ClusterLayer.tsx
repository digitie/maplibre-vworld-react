'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useSupercluster from 'use-supercluster';
import type Supercluster from 'supercluster';
import { useMap } from '../store/hooks';
import { ClusterMarker } from './ClusterMarker';

/**
 * Standard supercluster point Feature with the original consumer data merged
 * into `properties`.
 */
export interface ClusterPointFeature<P = Record<string, unknown>> {
  type: 'Feature';
  properties: P & {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string | number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

/**
 * Input point. Beyond `id` and `lngLat`, arbitrary properties are preserved
 * and surfaced through the `renderMarker` callback's `point` argument.
 */
export interface ClusterPoint {
  id: string | number;
  lngLat: [number, number];
  [key: string]: unknown;
}

export interface ClusterLayerProps {
  /**
   * Points to cluster. Should be referentially stable (memoize it or hold it
   * in a ref) — a fresh array identity on every render forces
   * `use-supercluster` to deep-compare and rebuild the cluster index on each
   * pan/zoom, which is O(N) per camera movement for large point sets.
   */
  points: ClusterPoint[];
  /** Render an unclustered point. */
  renderMarker: (point: ClusterPoint) => React.ReactNode;
  /**
   * Render a cluster bubble. If omitted, {@link ClusterMarker} is used and
   * clicking expands the cluster via `flyTo` to the supercluster expansion
   * zoom.
   */
  renderCluster?: (
    cluster: ClusterPointFeature,
    pointCount: number,
    supercluster: Supercluster,
  ) => React.ReactNode;
  /** Pixel radius for grouping. @default 50 */
  radius?: number;
  /** Maximum zoom at which clustering still applies. @default 16 */
  maxZoom?: number;
  /**
   * If true, supercluster will generate stable IDs for clusters.
   * This is recommended to prevent React key churn on re-renders.
   * @default true
   */
  generateId?: boolean;
}

type Bounds = [number, number, number, number];

/**
 * Clusters dense marker collections via `supercluster`. Off-screen points
 * are not rendered (viewport culling), and re-cluster only happens when
 * the view bounds or zoom level actually change.
 *
 * Consumers supply a flat `points` array and a `renderMarker` function. The
 * library handles the GeoJSON conversion and supercluster lifecycle.
 */
export const ClusterLayer: React.FC<ClusterLayerProps> = ({
  points,
  renderMarker,
  renderCluster,
  radius = 50,
  maxZoom = 16,
  generateId = true,
}) => {
  const map = useMap();
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [zoom, setZoom] = useState<number>(() => 0);

  useEffect(() => {
    if (!map) return;

    const update = () => {
      const b = map.getBounds();
      const next: Bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      setBounds((prev) =>
        prev &&
        prev[0] === next[0] &&
        prev[1] === next[1] &&
        prev[2] === next[2] &&
        prev[3] === next[3]
          ? prev
          : next,
      );
      setZoom((prev) => {
        const z = map.getZoom();
        return prev === z ? prev : z;
      });
    };

    // `getBounds()` returns a degenerate box before the map's first
    // `idle`; wait for that to fire (or `load` if it has not yet) so the
    // first cluster pass uses real viewport bounds.
    if (map.loaded()) {
      update();
    } else {
      map.once('load', update);
    }
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('load', update);
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, [map]);

  const features = useMemo<ClusterPointFeature[]>(
    () =>
      points.map((point) => ({
        type: 'Feature',
        properties: { cluster: false, ...point },
        geometry: { type: 'Point', coordinates: point.lngLat },
      })),
    [points],
  );
  const options = useMemo(() => ({ radius, maxZoom, generateId }), [radius, maxZoom, generateId]);

  const { clusters, supercluster } = useSupercluster({
    points: features,
    bounds: bounds ?? undefined,
    zoom,
    options,
  });

  if (!map) return null;

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates as [number, number];
        const { cluster: isCluster, point_count, cluster_id } = cluster.properties as {
          cluster: boolean;
          point_count?: number;
          cluster_id?: number;
        };

        if (isCluster) {
          const sc = supercluster as Supercluster | undefined;
          const count = point_count ?? 0;
          if (renderCluster && sc) {
            return (
              <React.Fragment key={`cluster-${cluster_id ?? `${lng},${lat}`}`}>
                {renderCluster(cluster as ClusterPointFeature, count, sc)}
              </React.Fragment>
            );
          }
          if (cluster_id === undefined || !sc) return null;
          return (
            <ClusterMarker
              key={`cluster-${cluster_id}`}
              lngLat={[lng, lat]}
              count={count}
              onClick={() => {
                map.flyTo({
                  center: [lng, lat],
                  zoom: sc.getClusterExpansionZoom(cluster_id),
                  speed: 1.5,
                });
              }}
            />
          );
        }

        const point = cluster.properties as unknown as ClusterPoint;
        return (
          <React.Fragment key={point.id}>
            {renderMarker(point)}
          </React.Fragment>
        );
      })}
    </>
  );
};
