/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param a First point as `[longitude, latitude]`
 * @param b Second point as `[longitude, latitude]`
 * @returns Distance in meters
 */
export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (val: number) => (val * Math.PI) / 180;

  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const deltaLat = toRad(b[1] - a[1]);
  const deltaLng = toRad(b[0] - a[0]);

  const h =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Formats a distance in meters to a human-readable string (e.g. "1.2 km" or "500 m").
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(1) + ' km';
  }
  return Math.round(meters) + ' m';
}
