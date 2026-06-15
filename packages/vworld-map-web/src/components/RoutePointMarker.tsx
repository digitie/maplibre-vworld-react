'use client';

import React from 'react';
import { Marker, type MarkerProps } from './Marker';

export interface RoutePointMarkerProps extends Omit<MarkerProps, 'children'> {
  label: string | number;
  color?: string;
  size?: number;
}

export const RoutePointMarker: React.FC<RoutePointMarkerProps> = ({
  label,
  color = '#111',
  size = 24,
  ...props
}) => {
  const dotStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
    color: 'white',
    border: '2px solid white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: size * 0.55,
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
  };

  return (
    <Marker {...props}>
      <div style={dotStyle}>
        {label}
      </div>
    </Marker>
  );
};
