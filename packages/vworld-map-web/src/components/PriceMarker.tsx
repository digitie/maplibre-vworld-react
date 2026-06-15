'use client';

import React, { useState, useRef } from 'react';
import { Marker, type MarkerProps } from './Marker';
import { useMapSelector } from '../store/hooks';

export interface PriceItem {
  label?: string;
  price: string | number;
  /** Currency / unit symbol shown before the price. Falls back to the root `currency` prop. */
  currency?: string;
}

export interface PriceMarkerProps extends Omit<MarkerProps, 'children'> {
  /** Single price or an array of price items (e.g., for gas stations with multiple fuels). */
  price: string | number | PriceItem[];
  /** Currency / unit symbol shown before the price. @default '' */
  currency?: string;
  /** Apply hover styling. @default true */
  isHoverable?: boolean;
  /** 
   * Semantic zoom thresholds for Level of Detail (LOD): `[stage2Zoom, stage3Zoom]`.
   * - Zoom >= stage2Zoom: Stage 1 (Full detail, all prices)
   * - stage3Zoom <= Zoom < stage2Zoom: Stage 2 (Mid detail, up to 2 prices)
   * - Zoom < stage3Zoom: Stage 3 (Low detail, small dot)
   * @default [13, 11]
   */
  lodThresholds?: [number, number];
}

function formatPrice(p: string | number): string {
  if (typeof p === 'number') return p.toLocaleString();
  return p;
}

/**
 * Airbnb-style price chip marker.
 */
export const PriceMarker: React.FC<PriceMarkerProps> = ({
  price,
  currency = '',
  isHoverable = true,
  lodThresholds = [13, 11],
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // useMapSelector only triggers re-render when the resulting stage changes
  const stage = useMapSelector((s) => {
    if (s.zoom >= lodThresholds[0]) return 1;
    if (s.zoom >= lodThresholds[1]) return 2;
    return 3;
  });

  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const prevStageRef = useRef(stage);

  if (prevStageRef.current !== stage) {
    if (stage === 1) setIsManuallyExpanded(false);
    prevStageRef.current = stage;
  }

  const effectiveStage = isManuallyExpanded ? 1 : stage;

  const isArray = Array.isArray(price);

  if (effectiveStage === 3) {
    const dotStyle: React.CSSProperties = {
      width: '12px',
      height: '12px',
      padding: 0,
      boxSizing: 'border-box',
      background: isHovered && isHoverable ? '#222' : 'white',
      border: '2px solid #222',
      borderRadius: '50%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      cursor: isHoverable ? 'pointer' : 'default',
      transition: 'background 0.2s ease, transform 0.2s ease',
      transform: (isHovered && isHoverable) ? 'scale(1.2)' : 'scale(1)',
    };
    return (
      <Marker {...props}>
        <button
          type="button"
          aria-label="가격 상세 보기"
          onClick={() => {
            setIsManuallyExpanded(true);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={dotStyle}
        />
      </Marker>
    );
  }

  const displayPrice = isArray
    ? (effectiveStage === 2 ? (price as PriceItem[]).slice(0, 2) : (price as PriceItem[]))
    : price;

  const chipStyle: React.CSSProperties = {
    background: isHovered && isHoverable ? '#222' : 'white',
    color: isHovered && isHoverable ? 'white' : '#222',
    border: '1px solid #ddd',
    borderRadius: isArray ? '12px' : '24px',
    padding: isArray ? '8px 12px' : '6px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: isHovered && isHoverable
      ? '0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 6px rgba(0,0,0,0.15)',
    cursor: isHoverable ? 'pointer' : 'default',
    transition: 'background 0.2s ease-in-out, color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
    transform: (isHovered && isHoverable) ? 'scale(1.05)' : 'scale(1)',
    display: 'flex',
    flexDirection: isArray ? 'column' : 'row',
    alignItems: isArray ? 'stretch' : 'center',
    gap: isArray ? '4px' : '2px',
    minWidth: isArray ? '120px' : 'auto',
  };

  return (
    <Marker {...props}>
      <div
        // Only expose button semantics when the chip is actually actionable
        // (manually expanded). Otherwise it would be a dead focusable control
        // announced as a button that does nothing on Enter/Space/click.
        {...(isManuallyExpanded
          ? {
              role: 'button',
              tabIndex: 0,
              onClick: () => setIsManuallyExpanded(false),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsManuallyExpanded(false);
                }
              },
            }
          : {})}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={chipStyle}
      >
        {isArray ? (
          (displayPrice as PriceItem[]).map((p, i) => (
            <div key={`${p.label ?? ''}-${p.price}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              {p.label && (
                <span style={{ 
                  color: isHovered && isHoverable ? '#aaa' : '#666', 
                  fontSize: '12px', 
                  fontWeight: 'normal' 
                }}>
                  {p.label}
                </span>
              )}
              <span>
                {p.currency !== undefined ? p.currency : currency}
                {formatPrice(p.price)}
              </span>
            </div>
          ))
        ) : (
          <>
            <span>{currency}</span>
            <span>{formatPrice(displayPrice as string | number)}</span>
          </>
        )}
      </div>
    </Marker>
  );
};
