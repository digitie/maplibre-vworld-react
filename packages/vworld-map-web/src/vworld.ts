import maplibregl, { type ErrorEvent, type StyleSpecification, type AddProtocolAction } from 'maplibre-gl';
import {
  createVWorldStyle,
  getVWorldTileUrl as coreGetVWorldTileUrl,
  getVWorldMaxZoom as coreGetVWorldMaxZoom,
  type VWorldMapType,
} from 'vworld-map-core';

let vworldProtocolRegistered = false;
const fallbackCache = new Map<string, ArrayBuffer>();
const FALLBACK_CACHE_LIMIT = 32;

/**
 * Insert into the fallback cache with a simple FIFO bound so this module-level
 * Map cannot grow without limit over a long session (distinct imageUrl/label
 * combinations would otherwise accumulate forever).
 */
function cacheFallback(key: string, data: ArrayBuffer): void {
  if (fallbackCache.size >= FALLBACK_CACHE_LIMIT) {
    const oldest = fallbackCache.keys().next().value;
    if (oldest !== undefined) fallbackCache.delete(oldest);
  }
  fallbackCache.set(key, data);
}

async function getFallbackImageData(imageUrl: string | null, label: string | null): Promise<ArrayBuffer> {
  const cacheKey = `${imageUrl || ''}|${label || ''}`;
  const cached = fallbackCache.get(cacheKey);
  if (cached) return cached;

  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const data = await res.arrayBuffer();
        cacheFallback(cacheKey, data);
        return data;
      }
    } catch {
      // Ignore and fallback to default SVG
    }
  }

  const text = label || '지원하지 않는 타일';
  const svg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#f5f5f5" />
  <circle cx="128" cy="110" r="24" fill="none" stroke="#ccc" stroke-width="4" />
  <line x1="111" y1="93" x2="145" y2="127" stroke="#ccc" stroke-width="4" />
  <text x="128" y="155" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle">${text}</text>
</svg>`;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const data = await blob.arrayBuffer();
  fallbackCache.set(cacheKey, data);
  return data;
}

const vworldProtocolHandler: AddProtocolAction = async (params, abortController) => {
  const urlObj = new URL(params.url);
  const fallbackUrl = urlObj.searchParams.get('fallback');
  const label = urlObj.searchParams.get('label');
  const mapId = urlObj.searchParams.get('mapId');
  
  urlObj.protocol = 'https:';
  urlObj.searchParams.delete('fallback');
  urlObj.searchParams.delete('label');
  urlObj.searchParams.delete('mapId');
  const realUrl = urlObj.toString();

  try {
    const response = await fetch(realUrl, { signal: abortController.signal });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    const data = await response.arrayBuffer();
    return { data };
  } catch (error: unknown) {
    if (abortController.signal.aborted) throw error;
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vworld-tile-error', { 
        detail: { url: realUrl, error, mapId } 
      }));
    }

    const data = await getFallbackImageData(fallbackUrl, label);
    return { data };
  }
};

/**
 * Registers the `vworld://` custom protocol handler with MapLibre.
 * This enables rendering a fallback image when a tile fails to load.
 */
export function registerVWorldProtocol(): void {
  if (vworldProtocolRegistered || typeof window === 'undefined') return;
  vworldProtocolRegistered = true;
  maplibregl.addProtocol('vworld', vworldProtocolHandler);
}

/**
 * VWorld layer identifier. `gray` is a synonym for the VWorld "white" basemap.
 */
export type VWorldLayerType = 'Base' | 'gray' | 'midnight' | 'Hybrid' | 'Satellite';

/**
 * Map the web adapter's (capitalized) public layer type onto core's domain
 * map type, so all tile-URL / style / zoom logic lives in vworld-map-core and
 * never diverges between platforms.
 */
const LAYER_TYPE_TO_MAP_TYPE: Record<VWorldLayerType, VWorldMapType> = {
  Base: 'base',
  gray: 'gray',
  midnight: 'midnight',
  Hybrid: 'hybrid',
  Satellite: 'satellite',
};

const TRANSIENT_TILE_ERROR_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);
const VWORLD_WMTS_PATH = /(\/req\/wmts\/1\.0\.0\/)([^/?#]+)(\/)/;

/**
 * MapLibre `error.error` value shape when the failure comes from a resource
 * loader (tile fetch, style fetch, image fetch). MapLibre attaches `status` /
 * `url` / `statusText` on those errors but does not type them.
 */
export interface VWorldResourceError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
}

/**
 * Build a VWorld WMTS tile URL template for a layer. The returned string
 * contains MapLibre placeholders `{z}/{y}/{x}` so it can be passed directly
 * to a raster source's `tiles` array.
 *
 * The API key is `encodeURIComponent`-encoded after trimming surrounding
 * whitespace, so accidental newlines / spaces in environment variables do not
 * break the URL.
 */
export function getVWorldTileUrl(apiKey: string, layerType: VWorldLayerType): string {
  return coreGetVWorldTileUrl(apiKey, LAYER_TYPE_TO_MAP_TYPE[layerType]);
}

/**
 * Maximum zoom level the VWorld tile service serves for a given layer.
 * Satellite / Hybrid stop at z18; Base / gray / midnight go to z19.
 */
export function getVWorldMaxZoom(layerType: VWorldLayerType): number {
  return coreGetVWorldMaxZoom(LAYER_TYPE_TO_MAP_TYPE[layerType]);
}

/**
 * Replace the API-key segment of a VWorld WMTS tile URL with `***` so the URL
 * can be safely logged, shown in error banners, or sent to monitoring.
 *
 * The VWorld WMTS path format is:
 *   `https://api.vworld.kr/req/wmts/1.0.0/{key}/{layer}/{z}/{y}/{x}.{ext}`
 *
 * Inputs that do not match the WMTS path are returned unchanged, so this is
 * safe to call on arbitrary URLs (e.g. logging error messages of unknown
 * origin). `undefined` is passed through as `undefined`.
 */
export function redactVWorldUrl(url: string): string;
export function redactVWorldUrl(url: string | undefined): string | undefined;
export function redactVWorldUrl(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  return url.replace(VWORLD_WMTS_PATH, '$1***$3');
}

/**
 * Heuristic: did this MapLibre `error` event originate from a VWorld tile
 * fetch? Useful for differentiating tile-level transient failures from style
 * / WebGL errors when deciding whether to surface a banner or retry.
 */
export function isVWorldTileError(event: ErrorEvent): boolean {
  const error = event.error as VWorldResourceError | undefined;
  const message = error?.message?.toLowerCase() ?? '';
  const sourceId = (event as { sourceId?: unknown }).sourceId;
  const url = error?.url ?? '';

  return (
    (typeof sourceId === 'string' && sourceId.startsWith('vworld')) ||
    url.includes('/req/wmts/') ||
    message.includes('tile') ||
    message.includes('failed to fetch') ||
    TRANSIENT_TILE_ERROR_STATUSES.has(error?.status ?? 0)
  );
}

/**
 * Build a MapLibre {@link StyleSpecification} that renders the requested
 * VWorld layer. For `Hybrid`, the satellite imagery is laid down first and
 * the hybrid label tiles are stacked on top.
 */
export function getVWorldStyle(apiKey: string, layerType: VWorldLayerType): StyleSpecification {
  // Delegate to core so the VWorld style is constructed in exactly one place.
  // Core returns a structurally-compatible raster style (MapLibre-free, per
  // AGENTS.md rule 3) which we surface as a StyleSpecification at the web
  // boundary.
  return createVWorldStyle(
    apiKey,
    LAYER_TYPE_TO_MAP_TYPE[layerType],
  ) as unknown as StyleSpecification;
}
