'use client';

import React from 'react';
import { Marker } from './Marker';
import { PulsingMarker, type PulsingMarkerProps } from './PulsingMarker';

export interface UserLocationMarkerProps extends Omit<PulsingMarkerProps, 'children'> {
  /** User's position as `[longitude, latitude]`. */
  lngLat: [number, number];
  /** Accuracy in meters. If provided, draws a circular overlay around the location. */
  accuracy_m?: number;
}

/**
 * A marker specifically designed to represent the user's current location.
 * Internally uses `PulsingMarker` for the blue pulsing dot effect.
 */
export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  lngLat,
  accuracy_m,
  ...rest
}) => {
  // In a full implementation, accuracy_m could be rendered as an SVG circle or a maplibre 'circle' layer.
  // For now, we represent the accuracy via a CSS radial gradient inside an absolute div behind the marker.
  const accuracyRadiusPx = accuracy_m ? Math.min(accuracy_m * 2, 200) : 0; // simplistic visual scaling

  return (
    <>
      {accuracy_m ? (
        <Marker lngLat={lngLat} anchor="center">
          <div
            style={{
              width: `${accuracyRadiusPx}px`,
              height: `${accuracyRadiusPx}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(66, 133, 244, 0.15)',
              border: '1px solid rgba(66, 133, 244, 0.3)',
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </Marker>
      ) : null}
      <PulsingMarker lngLat={lngLat} {...rest} />
    </>
  );
};
