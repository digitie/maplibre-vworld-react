import type { VWorldMapType } from './props';
import { LAYER_PRESETS } from './layerPresets';

interface VWorldRasterSource {
  type: 'raster';
  tiles: string[];
  tileSize: number;
  attribution: string;
  maxzoom?: number;
}

interface VWorldRasterLayer {
  id: string;
  type: 'raster';
  source: string;
}

/**
 * Minimal MapLibre-compatible raster style shape. Declared locally so core
 * stays free of any MapLibre dependency (AGENTS.md rule 3) while still giving
 * the builder and its consumers real type checking instead of `any`.
 */
export interface VWorldStyleSpec {
  version: 8;
  sources: Record<string, VWorldRasterSource>;
  layers: VWorldRasterLayer[];
}

const VWORLD_ATTRIBUTION = '공간정보 오픈플랫폼 브이월드';

/** VWorld WMTS layer name for a domain map type. `gray` maps to VWorld's
 * `white` basemap. */
function vworldLayerName(mapType: VWorldMapType): string {
  switch (mapType) {
    case 'gray':
      return 'white';
    case 'midnight':
      return 'midnight';
    case 'hybrid':
      return 'Hybrid';
    case 'satellite':
      return 'Satellite';
    case 'base':
    default:
      return 'Base';
  }
}

/**
 * Build a VWorld WMTS tile-URL template (`.../{z}/{y}/{x}.{ext}`) for a map
 * type. The single source of truth for VWorld tile URLs — both the web and RN
 * adapters route through this so URL construction never diverges.
 *
 * The API key is trimmed and `encodeURIComponent`-encoded so accidental
 * whitespace/newlines in an env-injected key cannot produce a malformed URL
 * that 404s every tile.
 */
export function getVWorldTileUrl(apiKey: string, mapType: VWorldMapType): string {
  const key = encodeURIComponent(apiKey.trim());
  const layer = vworldLayerName(mapType);
  const ext = mapType === 'satellite' ? 'jpeg' : 'png';
  return `https://api.vworld.kr/req/wmts/1.0.0/${key}/${layer}/{z}/{y}/{x}.${ext}`;
}

/** Maximum zoom VWorld serves for a map type (Satellite/Hybrid stop at 18,
 * the rest at 19). Derived from {@link LAYER_PRESETS}, the single source of
 * truth shared with the RN camera clamp. */
export function getVWorldMaxZoom(mapType: VWorldMapType): number {
  return LAYER_PRESETS[mapType]?.maxZoom ?? 19;
}

export function createVWorldStyle(
  apiKey: string,
  mapType: VWorldMapType = 'base',
): VWorldStyleSpec {
  const maxzoom = getVWorldMaxZoom(mapType);

  const style: VWorldStyleSpec = {
    version: 8,
    sources: {},
    layers: [],
  };

  if (mapType === 'hybrid') {
    // Lay the satellite imagery down first, then stack the hybrid labels.
    style.sources['vworld-satellite'] = {
      type: 'raster',
      tiles: [getVWorldTileUrl(apiKey, 'satellite')],
      tileSize: 256,
      attribution: VWORLD_ATTRIBUTION,
      maxzoom: getVWorldMaxZoom('satellite'),
    };
    style.layers.push({
      id: 'vworld-satellite-layer',
      type: 'raster',
      source: 'vworld-satellite',
    });
  }

  style.sources['vworld-base'] = {
    type: 'raster',
    tiles: [getVWorldTileUrl(apiKey, mapType)],
    tileSize: 256,
    attribution: VWORLD_ATTRIBUTION,
    maxzoom,
  };

  style.layers.push({
    id: 'vworld-base-layer',
    type: 'raster',
    source: 'vworld-base',
  });

  return style;
}
