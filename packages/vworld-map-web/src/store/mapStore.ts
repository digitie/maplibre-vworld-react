'use client';

import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Snapshot of map state exposed to React via {@link useSyncExternalStore}.
 *
 * The store is a vanilla JS event emitter — it lives outside React's render
 * cycle so map events do not force the entire component tree to re-render.
 * Components opt in to the slice they need through {@link useMap},
 * {@link useMapZoom}, or {@link useMapSelector}.
 */
export interface MapStoreSnapshot {
  /** The MapLibre instance, or `null` before mount / after unmount. */
  map: MapLibreMap | null;
  /** Whether the map has emitted its `load` event. */
  loaded: boolean;
  /** Current zoom level. Updates on `zoomend`. */
  zoom: number;
  /** Optional global semantic zoom threshold for marker simplification. */
  semanticZoomThreshold: number | undefined;
}

const INITIAL_SNAPSHOT: MapStoreSnapshot = {
  map: null,
  loaded: false,
  zoom: 0,
  semanticZoomThreshold: undefined,
};

/**
 * External store for map state. Use through the hooks in `./hooks`; consumers
 * should not touch the store directly.
 */
export class MapStore {
  private snapshot: MapStoreSnapshot = INITIAL_SNAPSHOT;
  private listeners = new Set<() => void>();

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): MapStoreSnapshot => this.snapshot;

  setMap(map: MapLibreMap | null): void {
    if (this.snapshot.map === map) return;
    this.snapshot = { ...this.snapshot, map, loaded: false };
    this.emit();
  }

  setLoaded(loaded: boolean): void {
    if (this.snapshot.loaded === loaded) return;
    this.snapshot = { ...this.snapshot, loaded };
    this.emit();
  }

  setZoom(zoom: number): void {
    if (this.snapshot.zoom === zoom) return;
    this.snapshot = { ...this.snapshot, zoom };
    this.emit();
  }

  setSemanticZoomThreshold(threshold: number | undefined): void {
    if (this.snapshot.semanticZoomThreshold === threshold) return;
    this.snapshot = { ...this.snapshot, semanticZoomThreshold: threshold };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
