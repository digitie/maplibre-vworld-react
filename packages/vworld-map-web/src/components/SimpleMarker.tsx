'use client';

import React, { useCallback } from 'react';
import { Marker, type MarkerProps } from './Marker';
import { PinMarker } from './PinMarker';
import { useMapSelector } from '../store/hooks';

export interface SimpleMarkerProps extends Omit<MarkerProps, 'children'> {
  label: string;
  bgColor?: string;
  textColor?: string;
  /**
   * Below this zoom, simplify to a small {@link PinMarker} instead of the
   * full label pill. Falls back to the map's `semanticZoomThreshold` prop.
   */
  simplifyAtZoom?: number;
}

/**
 * Label pill marker with optional semantic zoom simplification. Only
 * re-renders when the zoom level *crosses* the simplification threshold,
 * not on every zoom change — thanks to {@link useMapSelector}.
 */
export const SimpleMarker: React.FC<SimpleMarkerProps> = ({
  label,
  bgColor = '#222',
  textColor = 'white',
  simplifyAtZoom,
  ...props
}) => {
  const shouldSimplify = useMapSelector(
    useCallback(
      (s) => {
        const threshold = simplifyAtZoom ?? s.semanticZoomThreshold;
        return threshold !== undefined && s.zoom < threshold;
      },
      [simplifyAtZoom],
    ),
  );

  if (shouldSimplify) {
    // Forward all interaction/visual props (onClick, selected, interactionId,
    // …) so behavior is continuous across the zoom threshold; the explicit
    // color/size/showInnerCircle overrides come after the spread.
    return <PinMarker {...props} color={bgColor} size={20} showInnerCircle={false} />;
  }

  const pillStyle: React.CSSProperties = {
    background: bgColor,
    color: textColor,
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  };

  return (
    <Marker {...props}>
      <div style={pillStyle}>
        {label}
      </div>
    </Marker>
  );
};
