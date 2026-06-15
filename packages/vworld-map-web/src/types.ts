/**
 * Public type surface for `vworld-map-web`.
 *
 * `MarkerAnchor` is a domain alias (same values as MapLibre's `PositionAnchor`)
 * so consumers don't have to reach into `maplibre-gl` for the common case.
 *
 * The remaining names are deliberate re-exports of MapLibre types that appear
 * in this package's public signatures. `VWorldMapView` intentionally passes
 * *raw* MapLibre event objects through to its callbacks (a power-user feature —
 * see its docstring), so rather than hiding those shapes we re-export them here
 * so application code can import them from `vworld-map-web` instead of taking a
 * direct dependency on `maplibre-gl`.
 */

/** Where a marker element anchors against its `lngLat`. */
export type MarkerAnchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  Popup as MapLibrePopup,
  MapMouseEvent,
  MapLibreEvent,
  ErrorEvent as MapErrorEvent,
  MapGeoJSONFeature,
  LngLatBoundsLike,
  PointLike,
  FlyToOptions,
  FitBoundsOptions,
  RequestTransformFunction,
  PopupOptions,
} from 'maplibre-gl';
