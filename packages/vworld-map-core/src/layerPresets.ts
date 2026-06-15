import type { VWorldMapType } from './props';

export const LAYER_PRESETS: Record<VWorldMapType, { maxZoom: number }> = {
  base: { maxZoom: 19 },
  gray: { maxZoom: 19 },
  midnight: { maxZoom: 19 },
  hybrid: { maxZoom: 18 },
  satellite: { maxZoom: 18 }
};
