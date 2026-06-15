'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Marker, type MarkerProps } from './Marker';
import { PinMarker } from './PinMarker';
import { useMapSelector } from '../store/hooks';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition;
}

export interface WeatherMarkerProps extends Omit<MarkerProps, 'children'> {
  temperature: number;
  condition: WeatherCondition;
  hourlyForecast?: HourlyForecast[];
  simplifyAtZoom?: number;
}

const conditionIcons: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
};

const conditionColors: Record<WeatherCondition, string> = {
  sunny: '#FFA500',
  cloudy: '#808080',
  rainy: '#4169E1',
  snowy: '#ADD8E6',
};

// Inject the fade-in keyframes once per browser session, not once per marker.
const FADE_IN_STYLE_ID = 'vworld-weather-marker-fadein';
function ensureFadeInStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FADE_IN_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FADE_IN_STYLE_ID;
  style.textContent = `
    @keyframes vworld-weather-fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

const CLOSE_BTN_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.1)',
  border: 'none',
  borderRadius: '50%',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  marginLeft: '4px',
  fontSize: '12px',
  padding: 0,
  color: '#333',
};

const FORECAST_POPUP_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  marginTop: '8px',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  padding: '12px',
  display: 'flex',
  gap: '12px',
  zIndex: 10,
  cursor: 'default',
  animation: 'vworld-weather-fadeIn 0.2s ease',
};

export const WeatherMarker: React.FC<WeatherMarkerProps> = ({
  temperature,
  condition,
  hourlyForecast,
  simplifyAtZoom,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
    if (shouldSimplify === false) setIsManuallyExpanded(false);
    prevShouldSimplifyRef.current = shouldSimplify;
  }

  if (shouldSimplify && !isManuallyExpanded) {
    return (
      <PinMarker
        lngLat={props.lngLat}
        color={conditionColors[condition]}
        size={24}
        showInnerCircle
        onClick={(e, context, marker) => {
          if (props.onClick) props.onClick(e, context, marker);
          setIsManuallyExpanded(true);
        }}
      />
    );
  }

  ensureFadeInStyle();
  const hasForecast = !!hourlyForecast?.length;

  const chipStyle: React.CSSProperties = {
    background: 'white',
    border: `2px solid ${conditionColors[condition]}`,
    borderRadius: '20px',
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: isExpanded ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
    fontWeight: 'bold',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    cursor: hasForecast ? 'pointer' : 'default',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
    zIndex: isExpanded ? 10 : 1,
  };

  return (
    <Marker {...props}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (hasForecast) setIsExpanded((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && hasForecast) {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          style={chipStyle}
        >
          <span style={{ fontSize: '16px' }}>{conditionIcons[condition]}</span>
          <span>{temperature}°C</span>
          
          {shouldSimplify && isManuallyExpanded && (
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                setIsManuallyExpanded(false);
                setIsExpanded(false); // Also close forecast if open
              }}
              style={CLOSE_BTN_STYLE}
            >
              ✕
            </button>
          )}

          {hasForecast && (
            <span style={{ fontSize: '12px', color: '#999', marginLeft: '2px' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          )}
        </div>

        {isExpanded && hasForecast && (
          <div style={FORECAST_POPUP_STYLE}>
            {hourlyForecast!.map((forecast) => (
              <div
                key={forecast.time}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{forecast.time}</div>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{conditionIcons[forecast.condition]}</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{forecast.temperature}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Marker>
  );
};
