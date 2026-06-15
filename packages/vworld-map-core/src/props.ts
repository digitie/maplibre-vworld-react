import type { ReactNode } from 'react';
import type { FeatureCollection } from 'geojson';
import type { CameraState } from './cameraTypes';

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
  mapType?: VWorldMapType;
  markers?: MarkerItem[];
  geojson?: FeatureCollection;
  selectedFeatureId?: string;
  onMapPress?: (coord: [number, number]) => void;
  onFeaturePress?: (feature: unknown) => void;
  onCameraChanged?: (camera: CameraState) => void;
  style?: any; // For container styles
  children?: ReactNode;
}
