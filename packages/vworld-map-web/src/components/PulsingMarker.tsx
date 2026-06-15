'use client';

import React from 'react';
import { Marker, type MarkerProps } from './Marker';

export interface PulsingMarkerProps extends Omit<MarkerProps, 'children'> {
  color?: string;
  size?: number;
}

// Hoist the keyframes to a single <style> per page so N pulsing markers do
// not create N identical style nodes.
const PULSING_STYLE_ID = 'vworld-pulsing-marker-keyframes';
function ensurePulsingStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PULSING_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PULSING_STYLE_ID;
  style.textContent = `
    @keyframes vworld-pulsing-ripple {
      0%   { transform: scale(0.3); opacity: 0.8; }
      80%  { transform: scale(1);   opacity: 0; }
      100% { transform: scale(1);   opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export const PulsingMarker: React.FC<PulsingMarkerProps> = ({
  color = '#4285F4',
  size = 14,
  ...props
}) => {
  ensurePulsingStyle();

  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: color,
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    zIndex: 2,
    boxSizing: 'border-box',
  };
  const rippleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-100%',
    left: '-100%',
    width: '300%',
    height: '300%',
    backgroundColor: color,
    borderRadius: '50%',
    zIndex: 1,
    animation: 'vworld-pulsing-ripple 2s infinite ease-out',
  };

  return (
    <Marker {...props}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={dotStyle} />
        <div style={rippleStyle} />
      </div>
    </Marker>
  );
};
