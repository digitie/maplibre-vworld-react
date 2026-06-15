'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Marker, type MarkerProps } from './Marker';
import { PinMarker } from './PinMarker';
import { useMapSelector } from '../store/hooks';

export interface PlaceMarkerProps extends Omit<MarkerProps, 'children'> {
  title: string;
  description: string;
  category: string;
  photoUrl?: string;
  link?: string;
  /** Link button label. @default 'View more' */
  linkLabel?: string;
  /** Below this zoom, replace the card with a {@link PinMarker}. */
  simplifyAtZoom?: number;
}

const CARD_STYLE: React.CSSProperties = {
  position: 'relative',
  background: 'white',
  borderRadius: '8px',
  overflow: 'visible',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  width: '200px',
  fontFamily: 'sans-serif',
  cursor: 'default',
};
const CLOSE_BTN_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'rgba(0,0,0,0.5)',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  zIndex: 10,
  padding: 0,
  lineHeight: 1,
};
const ARROW_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: '-8px',
  left: '50%',
  transform: 'translateX(-50%)',
  borderWidth: '8px 8px 0',
  borderStyle: 'solid',
  borderColor: 'white transparent transparent transparent',
  display: 'block',
  width: 0,
};
// Stable reference so Marker's offset effect does not re-fire setOffset on
// every render (an inline [0, -8] would allocate a new array each time).
const PLACE_OFFSET: [number, number] = [0, -8];

export const PlaceMarker: React.FC<PlaceMarkerProps> = ({
  title,
  description,
  category,
  photoUrl,
  link,
  linkLabel = 'View more',
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

  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const prevShouldSimplifyRef = useRef(shouldSimplify);

  if (prevShouldSimplifyRef.current !== shouldSimplify) {
    if (shouldSimplify === false) {
      // Natural zoom-in occurred, reset manual override
      setIsManuallyExpanded(false);
    }
    prevShouldSimplifyRef.current = shouldSimplify;
  }

  if (shouldSimplify && !isManuallyExpanded) {
    return (
      <PinMarker 
        lngLat={props.lngLat} 
        color="#333" 
        size={24} 
        showInnerCircle={false} 
        onClick={(e, context, marker) => {
          if (props.onClick) props.onClick(e, context, marker);
          setIsManuallyExpanded(true);
        }}
      />
    );
  }

  return (
    // The card sits above the coordinate with the downward-pointing arrow
    // tip at the lngLat — use the `bottom` anchor with a small upward
    // offset so the arrow has room to sit above the dot.
    <Marker {...props} anchor="bottom" offset={PLACE_OFFSET}>
      <div style={CARD_STYLE}>
        {isManuallyExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsManuallyExpanded(false);
            }}
            style={CLOSE_BTN_STYLE}
            aria-label="Close"
          >
            ✕
          </button>
        )}
        <div style={ARROW_STYLE} />

        {photoUrl && (
          <img
            src={photoUrl}
            alt={title}
            style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div style={{ padding: '12px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.4' }}>
            {description}
          </div>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}
            >
              {linkLabel} →
            </a>
          )}
        </div>
      </div>
    </Marker>
  );
};
