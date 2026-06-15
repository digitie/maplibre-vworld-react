'use client';

import React, { useMemo } from 'react';
import { PinMarker, type PinMarkerProps } from './PinMarker';

export interface MakiMarkerProps extends Omit<PinMarkerProps, 'icon'> {
  /** Maki icon name (without `.svg`), e.g. `'restaurant'`, `'park'`. */
  icon: string;
  /** Override the CDN base URL serving the icon SVGs. */
  iconBaseUrl?: string;
  /** CSS color of the icon glyph. @default 'white' */
  iconColor?: string;
}

const DEFAULT_MAKI_ICON_BASE_URL = 'https://unpkg.com/@mapbox/maki@8.0.0/icons';

/**
 * Pin marker that displays a Mapbox Maki icon. The SVG is loaded as a CSS
 * mask so it can be colorized dynamically without parsing paths.
 */
export const MakiMarker: React.FC<MakiMarkerProps> = ({
  icon,
  iconBaseUrl = DEFAULT_MAKI_ICON_BASE_URL,
  color = '#2c3e50',
  iconColor = 'white',
  size = 40,
  ...props
}) => {
  const iconUrl = useMemo(() => {
    const base = iconBaseUrl.replace(/\/+$/, '');
    return `${base}/${icon}.svg`;
  }, [iconBaseUrl, icon]);

  const maskStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      backgroundColor: iconColor,
      WebkitMask: `url(${iconUrl}) no-repeat center / contain`,
      mask: `url(${iconUrl}) no-repeat center / contain`,
    }),
    [iconColor, iconUrl],
  );

  return (
    <PinMarker
      {...props}
      color={color}
      size={size}
      showInnerCircle={false}
      icon={<div style={maskStyle} />}
    />
  );
};
