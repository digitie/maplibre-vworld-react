import type { ReactNode } from 'react';
import type { FeatureCollection } from 'geojson';
import type { CameraState } from './cameraTypes';
import type { VWorldErrorLike } from './redact';

export type VWorldMapType = "base" | "satellite" | "hybrid" | "gray" | "midnight";

export interface MarkerItem {
  id: string;
  coordinate: [number, number]; // [lng, lat]
  title?: string;
  // Arbitrary user-defined fields are allowed but typed `unknown` so they
  // must be narrowed before use — this stops the index signature from
  // widening `id`/`coordinate`/`title` to `any` or swallowing typos.
  [key: string]: unknown;
}

export interface VWorldMapViewProps {
  apiKey: string;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  /** Minimum zoom level. */
  minZoom?: number;
  /** Maximum zoom level (clamped to the layer's max at runtime). */
  maxZoom?: number;
  /** Restrict panning to these bounds (`{ ne: [lng,lat], sw: [lng,lat] }`). */
  maxBounds?: { ne: [number, number]; sw: [number, number] };
  mapType?: VWorldMapType;
  /**
   * Rewrite each VWorld tile URL before the map requests it — e.g. route
   * requests through your own proxy that injects a short-lived token, so the
   * raw `apiKey` is never bundled into client tile requests or native logs.
   * Pass an empty/placeholder `apiKey` and inject the real credential here.
   */
  tileUrlTransform?: (url: string) => string;
  markers?: MarkerItem[];
  geojson?: FeatureCollection;
  selectedFeatureId?: string;
  onMapPress?: (coord: [number, number]) => void;
  onFeaturePress?: (feature: unknown) => void;
  onCameraChanged?: (camera: CameraState) => void;
  /** Fired when the map fails to load. The native event carries no URL, so use
   * {@link redactVWorldUrl} on any URL the app logs itself. */
  onError?: (error: VWorldErrorLike) => void;
  style?: any; // For container styles
  children?: ReactNode;
}
