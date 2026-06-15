'use client';

import React, { useMemo } from 'react';
import { RouteLine } from './RouteLine';
import { Marker } from './Marker';
import { haversine, formatDistance } from '../utils/distance';

export interface MeasureLineProps {
  /**
   * Unique ID prefix for the underlying RouteLine source/layer. Pass distinct
   * ids when rendering multiple MeasureLines on one map, otherwise their
   * RouteLines collide on MapLibre source/layer IDs.
   * @default 'measure-line'
   */
  id?: string;
  /** Array of points `[lng, lat]` defining the line segments. */
  points: Array<[number, number]>;
  /** Line color. */
  color?: string;
  /** Line width. */
  width?: number;
  /** Whether to show a total distance marker at the last point. @default true */
  showTotalDistance?: boolean;
  /** Whether to show segment distance markers at the midpoint of each segment. @default true */
  showSegmentDistances?: boolean;
}

/**
 * A line component that measures and displays distances along its segments.
 * Useful for building consumer measuring tools.
 */
export const MeasureLine: React.FC<MeasureLineProps> = ({
  id = 'measure-line',
  points,
  color = '#FF5252',
  width = 3,
  showTotalDistance = true,
  showSegmentDistances = true,
}) => {
  const { segments, totalDistance } = useMemo(() => {
    let total = 0;
    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = haversine(p1, p2);
      total += dist;
      
      const midPoint: [number, number] = [
        (p1[0] + p2[0]) / 2,
        (p1[1] + p2[1]) / 2,
      ];
      
      segs.push({
        midPoint,
        distance: dist,
        accumulatedDistance: total,
      });
    }
    return { segments: segs, totalDistance: total };
  }, [points]);

  if (points.length < 2) return null;

  const lastPoint = points[points.length - 1];

  const segmentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#333',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    border: `1px solid ${color}`,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };
  const totalStyle: React.CSSProperties = {
    backgroundColor: color,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <RouteLine id={`${id}-line`} coordinates={points} color={color} width={width} />

      {showSegmentDistances && segments.map((seg) => (
        <Marker key={`seg-${seg.midPoint[0]},${seg.midPoint[1]}`} lngLat={seg.midPoint} anchor="center">
          <div style={segmentStyle}>
            {formatDistance(seg.distance)}
          </div>
        </Marker>
      ))}

      {showTotalDistance && (
        <Marker lngLat={lastPoint} anchor="bottom" offset={[0, -10]}>
          <div style={totalStyle}>
            Total: {formatDistance(totalDistance)}
          </div>
        </Marker>
      )}
    </>
  );
};
