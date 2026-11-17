import React, { useRef, useCallback, useMemo, forwardRef, useImperativeHandle, type ComponentProps } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeSyntheticEvent } from 'react-native';
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  type MapRef,
  type CameraRef,
  type ViewStateChangeEvent,
  type PressEvent,
} from '@maplibre/maplibre-react-native';
import {
  VWorldMapViewProps,
  createVWorldStyle,
  LAYER_PRESETS
} from 'vworld-map-core';
import { Marker as VWorldMarker } from './components/Marker';

/** Camera padding in px: one value for every side, or per side (missing sides are 0). */
export type VWorldViewPadding = number | { top?: number; right?: number; bottom?: number; left?: number };

/** Imperative handle for programmatic camera control via a ref. */
export interface VWorldMapHandle {
  /** Animate to a center (and optional zoom). */
  flyTo(target: { center: [number, number]; zoom?: number; durationMs?: number }): void;
  /** Fit the camera to bounds. */
  fitBounds(
    bounds: { ne: [number, number]; sw: [number, number] },
    options?: { paddingPx?: VWorldViewPadding; durationMs?: number },
  ): void;
  /** Animate to a zoom level. */
  zoomTo(zoom: number, durationMs?: number): void;
}

/** Style accepted by the native map: a MapLibre style object or a style URL. */
export type VWorldNativeMapStyle = ComponentProps<typeof Map>['mapStyle'];

/** RN props: the shared core contract plus native-only additions. */
export interface VWorldMapViewNativeProps extends VWorldMapViewProps {
  /**
   * Explicit MapLibre style (object or URL). When given it replaces the VWorld
   * style, so local geometry / markers render without a VWorld key (parity with
   * vworld-map-web #32), `tileUrlTransform` is not applied and `maxZoom` is not
   * clamped to the VWorld layer max. Pass a stable reference for object styles.
   */
  mapStyle?: VWorldNativeMapStyle;
}

function toViewPadding(padding: VWorldViewPadding) {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

export const VWorldMapView = forwardRef<VWorldMapHandle, VWorldMapViewNativeProps>(({
  apiKey,
  mapStyle: explicitMapStyle,
  initialCenter = [126.9780, 37.5665], // Seoul City Hall default
  initialZoom = 14,
  minZoom,
  maxZoom,
  maxBounds,
  mapType = 'base',
  markers = [],
  geojson,
  selectedFeatureId,
  onMapPress,
  onFeaturePress,
  onCameraChanged,
  onError,
  tileUrlTransform,
  style,
  children
}, ref) => {
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  useImperativeHandle(ref, () => ({
    flyTo: ({ center, zoom, durationMs }) =>
      cameraRef.current?.flyTo({
        center,
        ...(zoom !== undefined ? { zoom } : {}),
        ...(durationMs !== undefined ? { duration: durationMs } : {}),
      }),
    fitBounds: ({ ne, sw }, options) =>
      cameraRef.current?.fitBounds([sw[0], sw[1], ne[0], ne[1]], {
        // paddingPx was accepted but never forwarded, so fitted pins ended up
        // under overlays; the native camera takes per-side view padding.
        ...(options?.paddingPx !== undefined ? { padding: toViewPadding(options.paddingPx) } : {}),
        ...(options?.durationMs !== undefined ? { duration: options.durationMs } : {}),
      }),
    zoomTo: (zoom, durationMs) =>
      cameraRef.current?.zoomTo(zoom, durationMs !== undefined ? { duration: durationMs } : undefined),
  }), []);

  const mapStyle = useMemo(() => {
    if (explicitMapStyle !== undefined) return explicitMapStyle;
    const style = createVWorldStyle(apiKey, mapType);
    if (!tileUrlTransform) return style;
    // Let the app rewrite tile URLs (proxy / token injection) so the raw key
    // never reaches the native tile loader.
    return {
      ...style,
      sources: Object.fromEntries(
        Object.entries(style.sources).map(([sourceId, source]) => [
          sourceId,
          { ...source, tiles: source.tiles.map(tileUrlTransform) },
        ]),
      ),
    };
  }, [apiKey, mapType, tileUrlTransform, explicitMapStyle]);

  const layerMaxZoom = LAYER_PRESETS[mapType]?.maxZoom || 19;
  // An explicit style is not a VWorld layer, so the VWorld layer max does not apply.
  const maxZoomLevel = explicitMapStyle !== undefined
    ? maxZoom
    : maxZoom !== undefined ? Math.min(maxZoom, layerMaxZoom) : layerMaxZoom;
  const maxBoundsFlat: [number, number, number, number] | undefined = maxBounds
    ? [maxBounds.sw[0], maxBounds.sw[1], maxBounds.ne[0], maxBounds.ne[1]]
    : undefined;

  const handlePress = useCallback((event: NativeSyntheticEvent<PressEvent>) => {
    if (onMapPress) {
      // v11 delivers the coordinate as nativeEvent.lngLat ([lng, lat]); the
      // old event.geometry.coordinates shape was removed.
      const { lngLat } = event.nativeEvent;
      if (lngLat) {
        onMapPress([lngLat[0], lngLat[1]]);
      }
    }
  }, [onMapPress]);

  const handleRegionDidChange = useCallback((event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    if (onCameraChanged) {
      // v11 ViewStateChangeEvent is a flat object on nativeEvent — there is no
      // event.geometry/properties, and the fields are zoom/bearing (not
      // zoomLevel/heading).
      const { center, zoom, pitch, bearing, bounds } = event.nativeEvent;
      onCameraChanged({
        center: [center[0], center[1]],
        zoom,
        pitch,
        heading: bearing,
        // LngLatBounds is the flat tuple [west, south, east, north].
        bounds: bounds
          ? { sw: [bounds[0], bounds[1]], ne: [bounds[2], bounds[3]] }
          : undefined,
      });
    }
  }, [onCameraChanged]);

  return (
    <View style={[styles.container, style]}>
      <Map
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle as any}
        attributionPosition={{ bottom: 8, right: 8 }}
        onPress={handlePress}
        onRegionDidChange={handleRegionDidChange}
        onDidFailLoadingMap={() => onError?.({ message: 'map-load-failed' })}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: initialCenter,
            zoom: initialZoom,
          }}
          minZoom={minZoom}
          maxZoom={maxZoomLevel}
          maxBounds={maxBoundsFlat}
        />
        
        {/* Render markers via the package's own Marker so selectedFeatureId
            and the shared pin styling apply (parity with the web adapter).
            Forward the per-marker pin props (color/highlighted/zIndex/ariaLabel)
            so the `markers` convenience prop has full Marker parity (#21). */}
        {markers.map((marker) => (
          <VWorldMarker
            key={marker.id}
            id={marker.id}
            lngLat={marker.coordinate}
            color={marker.color}
            selected={marker.selected ?? marker.id === selectedFeatureId}
            highlighted={marker.highlighted}
            zIndex={marker.zIndex}
            ariaLabel={marker.ariaLabel}
            onPress={() => onFeaturePress?.(marker)}
          />
        ))}

        {/* Render GeoJSON if provided */}
        {geojson && (
          <GeoJSONSource id="geojson-source" data={geojson}>
            <Layer 
              id="geojson-circle" 
              type="circle"
              paint={{
                'circle-radius': 6,
                'circle-color': '#ff0000',
              }} 
            />
          </GeoJSONSource>
        )}

        {children}
      </Map>
    </View>
  );
});

VWorldMapView.displayName = 'VWorldMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  }
});
