'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getVWorldMaxZoom,
  getVWorldStyle,
  redactVWorldUrl,
  registerVWorldProtocol,
  type VWorldLayerType,
} from './vworld';
import { MapStore } from './store/mapStore';
import { MapStoreContext, useEvent, useMapLoaded } from './store/hooks';

/**
 * Reason the map cannot be initialized.
 *
 * - `missing-api-key` — `apiKey` is empty or whitespace-only. The MapLibre
 *   instance is never created.
 * - `map-init-error` — the MapLibre constructor threw (typically no WebGL
 *   support). The accompanying `error` is the raw exception.
 */
export type VWorldMapFallbackReason = 'missing-api-key' | 'map-init-error';

export interface VWorldMapFallbackInfo {
  reason: VWorldMapFallbackReason;
  /** Present when `reason === 'map-init-error'`. */
  error?: Error;
}

export type MapInteractionSource = 'map' | 'marker' | 'popup' | 'cluster' | 'layer';

export interface MapInteractionContext {
  source: MapInteractionSource;
  interactionId?: string;
  lngLat?: [number, number];
  defaultPrevented: boolean;
}

/**
 * Props for the {@link VWorldMapView} component.
 *
 * Event-callback props (`onClick`, `onMoveEnd`, …) follow MapLibre's native
 * event names without the `on*Map*` prefix, matching the convention of
 * `react-map-gl` and other React map wrappers. Raw MapLibre event objects
 * are passed through unchanged so consumers can read MapLibre-typed fields
 * without unwrapping a custom envelope.
 */
export interface VWorldMapViewProps {
  /**
   * VWorld API Key. If empty or whitespace-only, {@link VWorldMapViewProps.fallback}
   * is rendered instead of mounting MapLibre.
   */
  apiKey: string;
  /**
   * VWorld layer to render.
   * @default 'Base'
   */
  layerType?: VWorldLayerType;
  /**
   * Initial map center, `[longitude, latitude]`.
   */
  center?: [number, number];
  /**
   * Initial zoom level.
   * @default 12
   */
  zoom?: number;
  /**
   * Pitch angle (degrees, 0–60).
   * @default 0
   */
  pitch?: number;
  /**
   * Bearing (degrees clockwise from north).
   * @default 0
   */
  bearing?: number;
  /** Minimum allowed zoom. @default 6 */
  minZoom?: number;
  /** Maximum allowed zoom. @default 22 (clamped at runtime to the layer max, 18 or 19). */
  maxZoom?: number;
  /** Restrict panning to this LngLatBounds. */
  maxBounds?: maplibregl.LngLatBoundsLike;
  /**
   * Global zoom threshold below which markers may simplify themselves.
   * Consumed via {@link useMapSelector}.
   */
  semanticZoomThreshold?: number;
  /** Render the built-in navigation control. @default true */
  navigation?: boolean;
  /** Render the built-in geolocate control. @default true */
  geolocate?: boolean;
  /** Render the built-in scale control. @default true */
  scale?: boolean;
  /** Container className. */
  className?: string;
  /**
   * Container style.
   * @default { width: '100%', height: '100%' }
   */
  style?: React.CSSProperties;
  /** Marker / layer / popup children. Mounted after the map fires `load`. */
  children?: React.ReactNode;
  /** Fired once after the MapLibre `load` event. */
  onLoad?: (map: MapLibreMap) => void;
  /** Raw MapLibre `click` event with interaction context. */
  onClick?: (event: maplibregl.MapMouseEvent, context: MapInteractionContext) => void;
  /** Raw MapLibre `contextmenu` event (right-click) with interaction context. */
  onContextMenu?: (event: maplibregl.MapMouseEvent, context: MapInteractionContext) => void;
  /** Raw MapLibre `moveend` event — camera came to rest after a pan/zoom. */
  onMoveEnd?: (event: maplibregl.MapLibreEvent) => void;
  /** Raw MapLibre `zoomend` event. */
  onZoomEnd?: (event: maplibregl.MapLibreEvent) => void;
  /** Raw MapLibre `idle` event — rendering finished, queue drained. */
  onIdle?: (event: maplibregl.MapLibreEvent) => void;
  /**
   * Raw MapLibre `error` event. If omitted, errors are logged via
   * `console.warn` with the API key in the URL redacted.
   *
   * Inspect tile-vs-style origin with {@link isVWorldTileError} and redact
   * URLs for logging with {@link redactVWorldUrl}.
   */
  onError?: (event: maplibregl.ErrorEvent) => void;
  /** Pre-request hook (CORS, auth headers, proxy rewrites). */
  transformRequest?: maplibregl.RequestTransformFunction;
  /**
   * Rendered instead of the map when the map cannot be initialized — see
   * {@link VWorldMapFallbackReason} for the cases. Accepts a node or a render
   * function.
   */
  fallback?: React.ReactNode | ((info: VWorldMapFallbackInfo) => React.ReactNode);
  /** Overlay shown until the map fires `load`. */
  loadingSkeleton?: React.ReactNode;
  /**
   * `false` → programmatic `center`/`zoom` prop changes use `jumpTo`
   * (instant). `true` (default) uses `flyTo` (animated).
   */
  animateCameraChanges?: boolean;
  /** Unified prop to set the camera target instead of individual center/zoom/pitch/bearing props. */
  cameraTarget?: { center: [number, number]; zoom: number; bearing?: number; pitch?: number; };
  /** How to animate camera changes when cameraTarget or bbox changes. Default is 'smooth'. */
  cameraTransition?: 'instant' | 'smooth' | 'flyOver';
  /** Bounding box to fit the camera into. `[minLng, minLat, maxLng, maxLat]` */
  bbox?: [number, number, number, number];
  /**
   * Optional settings for flyTo animations when legacy `center` or `zoom` change.
   * `center`, `zoom`, `pitch`, and `bearing` are always taken from the
   * corresponding props.
   */
  flyToOptions?: Omit<maplibregl.FlyToOptions, 'center' | 'zoom' | 'pitch' | 'bearing'>;
  /**
   * If `true`, uses `IntersectionObserver` to defer map initialization until the
   * container enters the viewport. If `'manual'`, waits until `lazyEnabled` is true.
   * @default false
   */
  lazy?: boolean | 'manual';
  /**
   * When `lazy="manual"`, controls whether the map should start loading.
   * Ignored if `lazy` is true or false.
   */
  lazyEnabled?: boolean;
  /**
   * Root margin for the IntersectionObserver when `lazy=true`.
   * @default '0px'
   */
  lazyRootMargin?: string;
  /**
   * Configuration for fallback mock tiles displayed when a VWorld tile fails
   * to load (e.g. out of zoom range or temporary provider error).
   * Providing this prop (even as an empty object `{}`) enables the fallback.
   */
  unsupportedTileFallback?: {
    imageUrl?: string;
    label?: string;
  };
}

function renderFallback(
  fallback: VWorldMapViewProps['fallback'],
  info: VWorldMapFallbackInfo,
): React.ReactNode {
  if (fallback === undefined) return null;
  if (typeof fallback === 'function') return fallback(info);
  return fallback;
}

function extractErrorUrl(event: maplibregl.ErrorEvent): string | undefined {
  const candidates: Array<unknown> = [
    (event as { error?: { url?: unknown } }).error?.url,
    (event as { url?: unknown }).url,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  return undefined;
}

interface CameraSnapshot {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

function sameCamera(a: CameraSnapshot, b: CameraSnapshot): boolean {
  return a.center[0] === b.center[0] &&
    a.center[1] === b.center[1] &&
    a.zoom === b.zoom &&
    a.pitch === b.pitch &&
    a.bearing === b.bearing;
}

function getInteractionContext(event: maplibregl.MapMouseEvent): MapInteractionContext {
  const target = event.originalEvent?.target as HTMLElement | undefined;
  let source: MapInteractionSource = 'map';
  let interactionId: string | undefined;

  const markerEl = target?.closest('.maplibregl-marker') as HTMLElement | undefined;
  const popupEl = target?.closest('.maplibregl-popup') as HTMLElement | undefined;

  if (markerEl) {
    source = markerEl.dataset.isCluster === 'true' ? 'cluster' : 'marker';
    interactionId = markerEl.dataset.interactionId;
  } else if (popupEl) {
    source = 'popup';
    interactionId = popupEl.dataset.interactionId;
  }

  return {
    source,
    interactionId,
    lngLat: [event.lngLat.lng, event.lngLat.lat],
    defaultPrevented: event.originalEvent?.defaultPrevented ?? false,
  };
}

let mapInstanceCounter = 0;

function applyFallbackToStyle(
  style: maplibregl.StyleSpecification,
  fallback: NonNullable<VWorldMapViewProps['unsupportedTileFallback']>,
  mapId: string
): maplibregl.StyleSpecification {
  registerVWorldProtocol();
  const fallbackParams = new URLSearchParams();
  if (fallback.imageUrl) fallbackParams.set('fallback', fallback.imageUrl);
  if (fallback.label) fallbackParams.set('label', fallback.label);
  fallbackParams.set('mapId', mapId);

  const sources = { ...style.sources };
  for (const [id, source] of Object.entries(sources)) {
    if (source.type === 'raster' && source.tiles) {
      sources[id] = {
        ...source,
        tiles: source.tiles.map((url) =>
          url.replace('https://api.vworld.kr', 'vworld://api.vworld.kr') + '?' + fallbackParams.toString()
        ),
      };
    }
  }
  return { ...style, sources };
}

/**
 * VWorld + MapLibre map container.
 *
 * Maintains a long-lived MapLibre instance: prop changes update the existing
 * map (style swap, camera animation, control toggles) rather than tearing
 * it down. Children consume the instance through hooks exported from
 * `./store` — for example `useMap()` to register sources/layers, or
 * `useMapSelector()` to subscribe to a derived slice of state.
 */
export const VWorldMapView: React.FC<VWorldMapViewProps> = ({
  apiKey,
  layerType = 'Base',
  center = [127.024612, 37.5326],
  zoom = 12,
  pitch = 0,
  bearing = 0,
  minZoom = 6,
  maxZoom = 22,
  maxBounds,
  semanticZoomThreshold,
  navigation = true,
  geolocate = true,
  scale = true,
  className = '',
  style = { width: '100%', height: '100%' },
  children,
  onLoad,
  onClick,
  onContextMenu,
  onMoveEnd,
  onZoomEnd,
  onIdle,
  onError,
  transformRequest,
  fallback,
  loadingSkeleton,
  animateCameraChanges = true,
  cameraTarget,
  cameraTransition = 'smooth',
  bbox,
  flyToOptions,
  lazy = false,
  lazyEnabled = false,
  lazyRootMargin = '0px',
  unsupportedTileFallback,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [store] = useState(() => new MapStore());
  const [mapId] = useState(() => String(++mapInstanceCounter));
  const [initError, setInitError] = useState<Error | null>(null);
  const [shouldMountLazy, setShouldMountLazy] = useState(() => lazy === false);
  const [mapLoadedForEffects, setMapLoadedForEffects] = useState(false);
  const lastCameraRef = useRef<CameraSnapshot>({ center, zoom, pitch, bearing });
  const pendingCameraRef = useRef<CameraSnapshot | null>(null);
  const appliedStyleRef = useRef({ apiKey, layerType });

  // Stable pass-through callbacks: handler identity never changes, but the
  // latest version is always invoked.
  const stableOnLoad = useEvent(onLoad);
  const stableOnClick = useEvent(onClick);
  const stableOnContextMenu = useEvent(onContextMenu);
  const stableOnMoveEnd = useEvent(onMoveEnd);
  const stableOnZoomEnd = useEvent(onZoomEnd);
  const stableOnIdle = useEvent(onIdle);

  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onErrorRef.current = onError;
  });

  const hasApiKey = typeof apiKey === 'string' && apiKey.trim().length > 0;
  const shouldMountMap = hasApiKey && initError === null && shouldMountLazy;

  const prevStyleKeyRef = useRef({ apiKey, layerType });
  if (
    prevStyleKeyRef.current.apiKey !== apiKey ||
    prevStyleKeyRef.current.layerType !== layerType
  ) {
    prevStyleKeyRef.current = { apiKey, layerType };
    setInitError(null);
  }

  // Listen for custom protocol tile errors
  useEffect(() => {
    if (!unsupportedTileFallback) return;
    const handleCustomTileError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.mapId !== mapId) return;
      const handler = onErrorRef.current;
      if (handler) {
        // `isVWorldTileError` / VWorldResourceError type `status` as a number
        // and test it against a Set<number>, so the regex capture (a string)
        // must be coerced or the transient-status branch never matches.
        const statusMatch = customEvent.detail.error?.message?.match(/HTTP error (\d+)/);
        const fakeErrorEvent = {
          type: 'error',
          error: Object.assign(new Error(customEvent.detail.error?.message ?? 'Tile fetch error'), {
            url: customEvent.detail.url,
            status: statusMatch ? Number(statusMatch[1]) : undefined,
          }),
        } as unknown as maplibregl.ErrorEvent;
        handler(fakeErrorEvent);
      }
    };
    window.addEventListener('vworld-tile-error', handleCustomTileError);
    return () => window.removeEventListener('vworld-tile-error', handleCustomTileError);
  }, [mapId, unsupportedTileFallback]);

  // Keep store's semanticZoomThreshold in sync with the prop.
  useEffect(() => {
    store.setSemanticZoomThreshold(semanticZoomThreshold);
  }, [store, semanticZoomThreshold]);

  // Handle lazy loading state
  useEffect(() => {
    if (lazy === 'manual') {
      if (lazyEnabled) setShouldMountLazy(true);
      return;
    }
    if (lazy !== true) {
      setShouldMountLazy(true);
      return;
    }

    if (shouldMountLazy) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldMountLazy(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldMountLazy(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, lazyEnabled, lazyRootMargin, shouldMountLazy]);

  // Mount / unmount the MapLibre instance.
  useEffect(() => {
    if (!shouldMountMap) return;
    if (!containerRef.current) return;

    const effectiveMaxZoom = Math.min(maxZoom, getVWorldMaxZoom(layerType));

    // Initialize the camera from cameraTarget / bbox when provided so a map
    // configured only with those does not start at the default Seoul center
    // and then visibly jump/animate after `load`. (`bounds` overrides
    // center/zoom in the MapLibre constructor.)
    const initialCamera = cameraTarget
      ? {
          center: cameraTarget.center,
          zoom: cameraTarget.zoom,
          pitch: cameraTarget.pitch ?? pitch,
          bearing: cameraTarget.bearing ?? bearing,
        }
      : { center, zoom, pitch, bearing };

    let map: MapLibreMap;
    try {
      let style = getVWorldStyle(apiKey, layerType);
      if (unsupportedTileFallback) {
        style = applyFallbackToStyle(style, unsupportedTileFallback, mapId);
      }
      map = new maplibregl.Map({
        container: containerRef.current,
        style,
        ...initialCamera,
        ...(bbox ? { bounds: bbox, fitBoundsOptions: { padding: 50 } } : {}),
        minZoom,
        maxZoom: effectiveMaxZoom,
        maxBounds,
        transformRequest,
      });
    } catch (err) {
      // eslint-disable-next-line react-doctor/no-adjust-state-on-prop-change
      setInitError(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    // eslint-disable-next-line react-doctor/no-adjust-state-on-prop-change
    setMapLoadedForEffects(false);
    appliedStyleRef.current = { apiKey, layerType };
    // Treat the constructor camera as already-applied so the post-load camera
    // effect does not detect a phantom diff and re-animate to the same target.
    lastCameraRef.current = initialCamera;
    store.setMap(map);
    store.setZoom(map.getZoom());

    const handleLoad = () => {
      store.setLoaded(true);
      store.setZoom(map.getZoom());
      setMapLoadedForEffects(true);
      stableOnLoad(map);
    };
    const handleZoomEnd = (event: maplibregl.MapLibreEvent) => {
      store.setZoom(map.getZoom());
      stableOnZoomEnd(event);
    };
    const handleMoveEnd = (event: maplibregl.MapLibreEvent) => {
      applyPendingCameraIfAny(map);
      stableOnMoveEnd(event);
    };
    const handleIdle = (event: maplibregl.MapLibreEvent) => {
      stableOnIdle(event);
    };
    const handleClick = (event: maplibregl.MapMouseEvent) => {
      stableOnClick(event, getInteractionContext(event));
    };
    const handleContextMenu = (event: maplibregl.MapMouseEvent) => {
      stableOnContextMenu(event, getInteractionContext(event));
    };
    const handleError = (event: maplibregl.ErrorEvent) => {
      const handler = onErrorRef.current;
      if (handler) {
        handler(event);
        return;
      }
      const url = extractErrorUrl(event);
      const redacted = url ? redactVWorldUrl(url) : '';
      const message =
        (event as { error?: { message?: string } }).error?.message ?? 'unknown error';
      // eslint-disable-next-line no-console
      console.warn(`[VWorldMap] ${message}`, redacted);
    };

    map.on('load', handleLoad);
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    map.on('idle', handleIdle);
    map.on('click', handleClick);
    map.on('contextmenu', handleContextMenu);
    map.on('error', handleError);

    let resizeFrame = 0;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (resizeFrame) return;
            resizeFrame = requestAnimationFrame(() => {
              resizeFrame = 0;
              map.resize();
            });
          })
        : null;
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      map.off('load', handleLoad);
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
      map.off('idle', handleIdle);
      map.off('click', handleClick);
      map.off('contextmenu', handleContextMenu);
      map.off('error', handleError);
      map.remove();
      setMapLoadedForEffects(false);
      store.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldMountMap]);

  // Built-in controls are added in dedicated effects (not the one-shot mount
  // effect) so toggling the `navigation` / `geolocate` / `scale` props after
  // mount actually adds/removes the control instead of being ignored.
  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map || !mapLoadedForEffects || !navigation) return;
    const control = new maplibregl.NavigationControl({ visualizePitch: true });
    map.addControl(control, 'top-right');
    return () => {
      try { map.removeControl(control); } catch { /* map already removed */ }
    };
  }, [navigation, mapLoadedForEffects, store]);

  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map || !mapLoadedForEffects || !geolocate) return;
    const control = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    map.addControl(control, 'top-right');
    return () => {
      try { map.removeControl(control); } catch { /* map already removed */ }
    };
  }, [geolocate, mapLoadedForEffects, store]);

  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map || !mapLoadedForEffects || !scale) return;
    const control = new maplibregl.ScaleControl({ maxWidth: 150, unit: 'metric' });
    map.addControl(control, 'bottom-right');
    return () => {
      try { map.removeControl(control); } catch { /* map already removed */ }
    };
  }, [scale, mapLoadedForEffects, store]);

  // transformRequest is applied at construction and kept current via the
  // public runtime setter when the prop changes.
  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map || !mapLoadedForEffects) return;
    map.setTransformRequest(transformRequest ?? null);
  }, [transformRequest, mapLoadedForEffects, store]);

  // Apply style changes (apiKey / layerType) to the existing map.
  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map) return;
    if (!mapLoadedForEffects) return;
    if (
      appliedStyleRef.current.apiKey === apiKey &&
      appliedStyleRef.current.layerType === layerType
    ) {
      return;
    }
    
    let style = getVWorldStyle(apiKey, layerType);
    if (unsupportedTileFallback) {
      style = applyFallbackToStyle(style, unsupportedTileFallback, mapId);
    }
    map.setStyle(style);
    appliedStyleRef.current = { apiKey, layerType };
  }, [apiKey, layerType, mapLoadedForEffects, store, mapId, unsupportedTileFallback]);

  const cameraOptionsRef = useRef({ animateCameraChanges, flyToOptions, cameraTarget, cameraTransition, bbox });
  useLayoutEffect(() => {
    cameraOptionsRef.current = { animateCameraChanges, flyToOptions, cameraTarget, cameraTransition, bbox };
  });

  const lastBboxRef = useRef(bbox);
  const pendingBboxRef = useRef<[number, number, number, number] | null>(null);

  // Both branches below clear their pending ref *before* triggering the imperative map call
  // (`fitBounds`/`jumpTo`), not after. `jumpTo` (and non-animated `fitBounds`, which routes
  // through the same instant path) fires `movestart`/`move`/`moveend` synchronously and
  // *unconditionally* — MapLibre does not skip the event sequence even when the target camera
  // equals the current one (verified against maplibre-gl's own `Camera.jumpTo` source). Since
  // `map.on('moveend', handleMoveEnd)` calls straight back into this function, a `moveend`
  // fired mid-call re-enters `applyPendingCameraIfAny` on the same synchronous call stack. If
  // the ref were still holding the value that call is *in the middle of applying*, the
  // reentrant call would see it as fresh, reissue the same imperative call, and recurse without
  // bound until the stack overflows (`RangeError: Maximum call stack size exceeded`, observed
  // in kor-travel-geo-ui's `/debug/reverse` map, `cameraTransition="instant"`). This reproduces
  // on a single isolated click, not only rapid double-clicks — the recursion has no dependency
  // on click count, only on the ref being read while still stale. Clearing it first makes the
  // reentrant call's `if (!pending) return;` (or the bbox equivalent) terminate the recursion
  // immediately, since by definition the update it would have applied already happened.
  const applyPendingCameraIfAny = useCallback((map: MapLibreMap): void => {
    const { cameraTransition: transition } = cameraOptionsRef.current;

    if (pendingBboxRef.current) {
      if (map.isMoving() || map.isEasing()) return;
      const b = pendingBboxRef.current;
      pendingBboxRef.current = null;
      lastBboxRef.current = b;
      map.fitBounds(b, {
        padding: 50,
        animate: transition !== 'instant',
        duration: transition === 'smooth' ? 300 : undefined
      });
      return;
    }

    const pending = pendingCameraRef.current;
    if (!pending) return;
    if (map.isMoving() || map.isEasing()) return;

    pendingCameraRef.current = null;
    lastCameraRef.current = pending;

    const { animateCameraChanges: animate, flyToOptions: options } = cameraOptionsRef.current;
    if (transition === 'instant' || !animate) {
      map.jumpTo(pending);
    } else if (transition === 'flyOver') {
      map.flyTo({ ...options, ...pending });
    } else {
      map.easeTo({ ...options, ...pending, duration: 300 });
    }
  }, []);

  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map) return;
    if (!mapLoadedForEffects) return;

    if (bbox && bbox !== lastBboxRef.current) {
      pendingBboxRef.current = bbox;
    }

    const nextCamera: CameraSnapshot = cameraTarget
      ? { center: cameraTarget.center, zoom: cameraTarget.zoom, pitch: cameraTarget.pitch ?? pitch, bearing: cameraTarget.bearing ?? bearing }
      : { center, zoom, pitch, bearing };
    if (!sameCamera(lastCameraRef.current, nextCamera)) {
      pendingCameraRef.current = nextCamera;
    }

    if (pendingBboxRef.current || pendingCameraRef.current) {
      applyPendingCameraIfAny(map);
    }
  }, [center[0], center[1], zoom, pitch, bearing, cameraTarget, bbox, mapLoadedForEffects, store, applyPendingCameraIfAny]);

  // Apply min/max zoom and bounds.
  useEffect(() => {
    const map = store.getSnapshot().map;
    if (!map) return;
    map.setMinZoom(minZoom);
    map.setMaxZoom(Math.min(maxZoom, getVWorldMaxZoom(layerType)));
    map.setMaxBounds(maxBounds);
  }, [minZoom, maxZoom, layerType, maxBounds, store]);

  const fallbackInfo: VWorldMapFallbackInfo | null = !hasApiKey
    ? { reason: 'missing-api-key' }
    : initError
      ? { reason: 'map-init-error', error: initError }
      : null;

  return (
    <MapStoreContext.Provider value={store}>
      {fallbackInfo ? (
        renderFallback(fallback, fallbackInfo)
      ) : (
        <>
          <div
            ref={containerRef}
            className={className}
            style={style}
            data-testid="vworld-map-container"
          />
          <MapChildren loadingSkeleton={loadingSkeleton}>{children}</MapChildren>
        </>
      )}
    </MapStoreContext.Provider>
  );
};

/**
 * Gates children mounting on the `loaded` slice of the store. Renders the
 * skeleton (if any) until then.
 */
const MapChildren: React.FC<{
  children: React.ReactNode;
  loadingSkeleton: React.ReactNode;
}> = ({ children, loadingSkeleton }) => {
  const loaded = useMapLoaded();
  return <>{loaded ? children : loadingSkeleton}</>;
};
