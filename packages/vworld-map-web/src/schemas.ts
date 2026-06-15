import { z } from 'zod';

/**
 * `[longitude, latitude]` tuple validated against the full WGS84 range.
 */
export const LngLatSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export type LngLat = z.infer<typeof LngLatSchema>;

/**
 * Map bounds tuple `[westLng, southLat, eastLng, northLat]` validated
 * against the full WGS84 range.
 */
export const BoundsSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export type Bounds = z.infer<typeof BoundsSchema>;

/**
 * Build a bounded `[lng, lat]` schema. Useful when the application only
 * cares about coordinates in a specific country / region and wants to reject
 * obviously-wrong inputs (mis-typed latitude/longitude order, default zero,
 * etc.) earlier than the map render.
 *
 * @example
 * const SeoulLngLat = makeBoundedLngLatSchema([126, 128], [37, 38]);
 */
export function makeBoundedLngLatSchema(
  lngRange: readonly [number, number],
  latRange: readonly [number, number],
) {
  return z.tuple([
    z.number().min(lngRange[0]).max(lngRange[1]),
    z.number().min(latRange[0]).max(latRange[1]),
  ]);
}

/**
 * Build a bounded `[westLng, southLat, eastLng, northLat]` schema.
 */
export function makeBoundedBoundsSchema(
  lngRange: readonly [number, number],
  latRange: readonly [number, number],
) {
  return z.tuple([
    z.number().min(lngRange[0]).max(lngRange[1]),
    z.number().min(latRange[0]).max(latRange[1]),
    z.number().min(lngRange[0]).max(lngRange[1]),
    z.number().min(latRange[0]).max(latRange[1]),
  ]);
}

function roundCoordinate(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

/**
 * Round a `[lng, lat]` tuple to `precision` decimal places. Default 4 digits
 * (~11m resolution) is appropriate for URL params and analytics.
 */
export function formatLngLat(lngLat: LngLat, precision = 4): LngLat {
  return [
    roundCoordinate(lngLat[0], precision),
    roundCoordinate(lngLat[1], precision),
  ];
}

/**
 * Serialize a bounds tuple to a comma-separated string suitable for URL
 * query params. Default 6 digits (~10cm) preserves enough precision for
 * round-trip without bloating the URL.
 */
export function serializeBounds(bounds: Bounds, precision = 6): string {
  return bounds.map((value) => roundCoordinate(value, precision)).join(',');
}

/**
 * Parse a comma-separated bounds string. Throws a `ZodError` if the result
 * is not a valid `[W, S, E, N]` tuple.
 */
export function parseBoundsParam(value: string): Bounds {
  const parts = value.split(',').map((part) => Number(part.trim()));
  return BoundsSchema.parse(parts);
}

/**
 * Minimum point schema used by the clustering / marker APIs: an `id`
 * (string or number) and an `lngLat`. Extend this with `extendPointSchema`
 * when you need additional properties.
 */
export const PointSchema = z.object({
  id: z.union([z.string(), z.number()]),
  lngLat: LngLatSchema,
});

export type Point = z.infer<typeof PointSchema>;

/**
 * Extend the {@link PointSchema} with custom properties.
 *
 * @example
 * const PlaceSchema = extendPointSchema({ name: z.string(), category: z.string() });
 */
export function extendPointSchema<T extends z.ZodRawShape>(properties: T) {
  return PointSchema.extend(properties);
}

/**
 * Route coordinates: at least 2 points. Each point is validated against the
 * full WGS84 range.
 */
export const RouteCoordinatesSchema = z
  .array(LngLatSchema)
  .min(2, 'Route must have at least 2 points');

export type RouteCoordinates = z.infer<typeof RouteCoordinatesSchema>;

/**
 * Shallow Zod validation for GeoJSON objects to catch obvious structure errors
 * early in development without full coordinate traversal.
 */
const BaseGeoJSONSchema = z.object({
  type: z.string(),
}).passthrough();

export const PolygonAreaInputSchema = z.union([
  z.string().url('data must be a valid URL if passed as string'),
  BaseGeoJSONSchema.refine((val) => {
    if (val.type === 'FeatureCollection') return true;
    if (val.type === 'Feature') {
      const geomType = (val as any).geometry?.type;
      return geomType === 'Polygon' || geomType === 'MultiPolygon';
    }
    return false;
  }, 'data must be a GeoJSON Feature(Polygon/MultiPolygon), FeatureCollection, or a valid URL string'),
]);

export const RouteLineGeoJSONSchema = z.union([
  z.string().url('data must be a valid URL if passed as string'),
  BaseGeoJSONSchema.refine((val) => {
    if (val.type === 'FeatureCollection') return true;
    if (val.type === 'Feature') {
      const geomType = (val as any).geometry?.type;
      return geomType === 'LineString' || geomType === 'MultiLineString';
    }
    return false;
  }, 'data must be a GeoJSON Feature(LineString/MultiLineString), FeatureCollection, or a valid URL string'),
]);
