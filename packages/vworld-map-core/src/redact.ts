/**
 * VWorld API-key redaction + tile-error detection. MapLibre-free so both the
 * web and React Native adapters (and consumers) can keep keys out of logs.
 */

const VWORLD_WMTS_PATH = /(\/req\/wmts\/1\.0\.0\/)([^/?#]+)(\/)/;

/**
 * Replace the API-key segment of a VWorld WMTS tile URL with `***` so the URL
 * can be safely logged. Inputs that do not match the WMTS path are returned
 * unchanged; `undefined` passes through as `undefined`.
 */
export function redactVWorldUrl(url: string): string;
export function redactVWorldUrl(url: string | undefined): string | undefined;
export function redactVWorldUrl(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  return url.replace(VWORLD_WMTS_PATH, '$1***$3');
}

/**
 * Plain (MapLibre-free) error shape used by {@link isVWorldTileError}. Populate
 * whatever fields a platform's error carries.
 */
export interface VWorldErrorLike {
  message?: string;
  status?: number;
  url?: string;
  sourceId?: string;
}

const TRANSIENT_TILE_ERROR_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);

/**
 * Heuristic: did this error originate from a VWorld tile fetch? Useful for
 * separating transient tile failures from style / GL errors.
 */
export function isVWorldTileError(error: VWorldErrorLike | null | undefined): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    (typeof error.sourceId === 'string' && error.sourceId.startsWith('vworld')) ||
    (error.url?.includes('/req/wmts/') ?? false) ||
    message.includes('tile') ||
    message.includes('failed to fetch') ||
    TRANSIENT_TILE_ERROR_STATUSES.has(error.status ?? 0)
  );
}
