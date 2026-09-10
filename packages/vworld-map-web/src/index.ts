// VWorld tile / style helpers + redactor
export {
  getVWorldTileUrl,
  getVWorldStyle,
  getVWorldMaxZoom,
  redactVWorldUrl,
  isVWorldTileError,
  registerVWorldProtocol,
  type VWorldLayerType,
  type VWorldResourceError,
} from './vworld.js';

// Map store + React hooks
export {
  MapStore,
  type MapStoreSnapshot,
  MapStoreContext,
  useMap,
  useMapZoom,
  useMapLoaded,
  useMapSelector,
  useEvent,
} from './store/index.js';

// Top-level map container
export {
  VWorldMapView,
  type VWorldMapViewProps,
  type VWorldMapFallbackInfo,
  type VWorldMapFallbackReason,
  type MapInteractionSource,
  type MapInteractionContext,
} from './VWorldMapView.web.js';

// Marker primitives
export { Marker, type MarkerProps } from './components/Marker.js';
export { PinMarker, type PinMarkerProps } from './components/PinMarker.js';
export { MakiMarker, type MakiMarkerProps } from './components/MakiMarker.js';
export { PulsingMarker, type PulsingMarkerProps } from './components/PulsingMarker.js';
export { UserLocationMarker, type UserLocationMarkerProps } from './components/UserLocationMarker.js';
export { MeasureLine, type MeasureLineProps } from './components/MeasureLine.js';
export { haversine, formatDistance } from './utils/distance.js';
export { SimpleMarker, type SimpleMarkerProps } from './components/SimpleMarker.js';
export { PlaceMarker, type PlaceMarkerProps } from './components/PlaceMarker.js';
export { PriceMarker, type PriceMarkerProps, type PriceItem } from './components/PriceMarker.js';
export {
  WeatherMarker,
  type WeatherMarkerProps,
  type WeatherCondition,
  type HourlyForecast,
} from './components/WeatherMarker.js';
export { RoutePointMarker, type RoutePointMarkerProps } from './components/RoutePointMarker.js';
export { ClusterMarker, type ClusterMarkerProps } from './components/ClusterMarker.js';

// Layer primitives
export {
  ClusterLayer,
  type ClusterLayerProps,
  type ClusterPoint,
  type ClusterPointFeature,
} from './components/ClusterLayer.js';
export {
  ServerClusterLayer,
  type ServerClusterLayerProps,
  type ServerClusterPoint,
} from './components/ServerClusterLayer.js';
export { RouteLine, type RouteLineProps } from './components/RouteLine.js';
export { PolygonArea, type PolygonAreaProps, type PolygonAreaInput } from './components/PolygonArea.js';

// Popup & ContextMenu
export { Popup, type PopupProps } from './components/Popup.js';
export { MapContextMenu, type MapContextMenuProps } from './components/MapContextMenu.js';

// Public type surface — domain aliases + MapLibre types used in the public API
// (re-exported so consumers import them from 'vworld-map-web', not 'maplibre-gl')
export type {
  MarkerAnchor,
  MapLibreMap,
  MapLibreMarker,
  MapLibrePopup,
  MapMouseEvent,
  MapLibreEvent,
  MapErrorEvent,
  MapGeoJSONFeature,
  LngLatBoundsLike,
  PointLike,
  FlyToOptions,
  FitBoundsOptions,
  RequestTransformFunction,
  PopupOptions,
} from './types.js';

// Zod schemas + helpers
export {
  LngLatSchema,
  BoundsSchema,
  PointSchema,
  RouteCoordinatesSchema,
  type LngLat,
  type Bounds,
  type Point,
  type RouteCoordinates,
  makeBoundedLngLatSchema,
  makeBoundedBoundsSchema,
  extendPointSchema,
  formatLngLat,
  serializeBounds,
  parseBoundsParam,
} from './schemas.js';
