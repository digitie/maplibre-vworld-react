'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { useMap, useEvent } from '../store/hooks';
import { PolygonAreaInputSchema } from '../schemas';

type PolygonGeoJSON =
  | GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
  | GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

export type PolygonAreaInput = PolygonGeoJSON | string;

type FeatureMouseEvent = maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
};

export interface PolygonAreaProps {
  /** Unique ID — used as prefix for the MapLibre source and layer IDs. */
  id: string;
  /**
   * GeoJSON Polygon / MultiPolygon Feature, FeatureCollection, or a URL
   * MapLibre can fetch. Must be referentially stable — pass a memoized value
   * or store the GeoJSON in a ref. Reference changes trigger `setData`.
   */
  data: PolygonAreaInput;
  /** @default 'rgba(33, 150, 243, 0.4)' */
  fillColor?: string;
  /** @default '#2196F3' */
  outlineColor?: string;
  /** @default 2 */
  outlineWidth?: number;
  onClick?: (event: FeatureMouseEvent) => void;
  onMouseEnter?: (event: FeatureMouseEvent) => void;
  onMouseLeave?: (event: maplibregl.MapMouseEvent) => void;
}

/**
 * Renders a GeoJSON Polygon / MultiPolygon as a MapLibre fill+line layer
 * pair, persisting across style swaps. Suitable for administrative
 * boundaries, parks, building footprints, etc.
 */
export const PolygonArea: React.FC<PolygonAreaProps> = ({
  id,
  data,
  fillColor = 'rgba(33, 150, 243, 0.4)',
  outlineColor = '#2196F3',
  outlineWidth = 2,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const map = useMap();
  const sourceId = `${id}-source`;
  const fillLayerId = `${id}-fill-layer`;
  const lineLayerId = `${id}-line-layer`;

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
      const result = PolygonAreaInputSchema.safeParse(data);
      if (!result.success) {
        console.warn(`[PolygonArea] Invalid data prop:`, result.error.issues);
      }
    }
  }, [data]);

  useEffect(() => {
    if (!map) return;

    const addOrUpdate = () => {
      if (!map.getStyle()) return;

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }

      if (!map.getLayer(fillLayerId)) {
        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': fillColor },
        });
      } else {
        map.setPaintProperty(fillLayerId, 'fill-color', fillColor);
      }

      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': outlineColor, 'line-width': outlineWidth },
        });
      } else {
        map.setPaintProperty(lineLayerId, 'line-color', outlineColor);
        map.setPaintProperty(lineLayerId, 'line-width', outlineWidth);
      }
    };

    addOrUpdate();
    // `style.load` fires once per full style swap (e.g. after `setStyle()`)
    // instead of every intermediate style mutation, so our paint updates
    // do not cause re-entrancy.
    map.on('style.load', addOrUpdate);

    return () => {
      map.off('style.load', addOrUpdate);
      if (!map.getStyle()) return;
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, data, fillColor, outlineColor, outlineWidth, sourceId, fillLayerId, lineLayerId]);

  // Event bindings — stable callbacks let us register once and not churn.
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

    map.on('click', fillLayerId, handleClick);
    map.on('mouseenter', fillLayerId, handleEnter);
    map.on('mouseleave', fillLayerId, handleLeave);

    return () => {
      map.off('click', fillLayerId, handleClick);
      map.off('mouseenter', fillLayerId, handleEnter);
      map.off('mouseleave', fillLayerId, handleLeave);
    };
    // We bind only on map / layerId — `useEvent` keeps the handlers stable.
    // `onMouseEnter` / `onClick` are still in deps so the cursor-pointer
    // gate updates when the consumer adds/removes those callbacks.
  }, [map, fillLayerId]);

  return null;
};
