'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { useMap, useEvent } from '../store/hooks';
import { RouteCoordinatesSchema, RouteLineGeoJSONSchema } from '../schemas';

type FeatureMouseEvent = maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
};

export interface RouteLineProps {
  /** Unique ID — prefixes the MapLibre source and layer IDs. */
  id?: string;
  /**
   * Polyline coordinates as `[longitude, latitude]` tuples. Must be
   * referentially stable: reference changes trigger a `setData` call.
   */
  coordinates?: [number, number][];
  /**
   * GeoJSON LineString / MultiLineString Feature, FeatureCollection, or URL.
   * If provided, overrides `coordinates`. Must be referentially stable.
   */
  data?: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString> | string;
  /** @default '#2196F3' */
  color?: string;
  /** Width in pixels. @default 4 */
  width?: number;
  /** Dash pattern, e.g. `[4, 4]` for 4-on / 4-off. */
  dashArray?: number[];
  onClick?: (event: FeatureMouseEvent) => void;
  onMouseEnter?: (event: FeatureMouseEvent) => void;
  onMouseLeave?: (event: maplibregl.MapMouseEvent) => void;
}

/**
 * Renders a polyline as a MapLibre line layer, persisting across style
 * swaps. For multi-line or already-built GeoJSON, drop down to the raw
 * MapLibre API via {@link useMap}.
 */
export const RouteLine: React.FC<RouteLineProps> = ({
  id = 'route-line',
  coordinates,
  data,
  color = '#2196F3',
  width = 4,
  dashArray,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const map = useMap();
  const sourceId = `${id}-source`;
  const layerId = `${id}-layer`;

  const stableOnClick = useEvent(onClick);
  const stableOnMouseEnter = useEvent(onMouseEnter);
  const stableOnMouseLeave = useEvent(onMouseLeave);

  const onClickRef = useRef(onClick);
  const onMouseEnterRef = useRef(onMouseEnter);
  useLayoutEffect(() => {
    onClickRef.current = onClick;
    onMouseEnterRef.current = onMouseEnter;
  });

  useEffect(() => {
    // @ts-ignore `process` may be untyped in a browser-only consumer build
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      if (data) {
        const result = RouteLineGeoJSONSchema.safeParse(data);
        if (!result.success) {
          console.warn(`[RouteLine] Invalid data prop:`, result.error.issues);
        }
      } else if (coordinates) {
        const result = RouteCoordinatesSchema.safeParse(coordinates);
        if (!result.success) {
          console.warn(`[RouteLine] Invalid coordinates prop:`, result.error.issues);
        }
      }
    }
  }, [coordinates, data]);

  // Build the Feature once per coordinates reference. Consumers that mutate
  // an array in place will not see updates — this is intentional, matching
  // how React props work everywhere else.
  const feature = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(
    () => {
      if (!coordinates) return null;
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      };
    },
    [coordinates],
  );

  useEffect(() => {
    if (!map) return;

    const addOrUpdate = () => {
      if (!map.getStyle()) return;

      const sourceData = data || feature;
      if (!sourceData) return;

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(sourceData);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: sourceData });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': color,
            'line-width': width,
            ...(dashArray ? { 'line-dasharray': dashArray } : {}),
          },
        });
      } else {
        map.setPaintProperty(layerId, 'line-color', color);
        map.setPaintProperty(layerId, 'line-width', width);
        map.setPaintProperty(layerId, 'line-dasharray', dashArray);
      }
    };

    addOrUpdate();
    // `style.load` fires once when a new style is fully ready (typically
    // after `setStyle()`), unlike `styledata` which fires for *every*
    // intermediate style mutation — including the paint-property updates
    // we make ourselves. Re-attaching only on full style swaps avoids the
    // pointless O(N²) work pattern.
    map.on('style.load', addOrUpdate);

    return () => {
      map.off('style.load', addOrUpdate);
      if (!map.getStyle()) return;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, data, feature, color, width, dashArray, sourceId, layerId]);

  useEffect(() => {
    if (!map) return;

    const handleClick = (event: FeatureMouseEvent) => stableOnClick(event);
    const handleEnter = (event: FeatureMouseEvent) => {
      if (onMouseEnterRef.current || onClickRef.current) map.getCanvas().style.cursor = 'pointer';
      stableOnMouseEnter(event);
    };
    const handleLeave = (event: maplibregl.MapMouseEvent) => {
      map.getCanvas().style.cursor = '';
      stableOnMouseLeave(event);
    };

    map.on('click', layerId, handleClick);
    map.on('mouseenter', layerId, handleEnter);
    map.on('mouseleave', layerId, handleLeave);

    return () => {
      map.off('click', layerId, handleClick);
      map.off('mouseenter', layerId, handleEnter);
      map.off('mouseleave', layerId, handleLeave);
    };
  }, [map, layerId]);

  return null;
};
