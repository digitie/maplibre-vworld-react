'use client';

import React, { useCallback, useMemo } from 'react';
import { Marker, type MarkerProps } from './Marker';
import { useEvent } from '../store/hooks';

export interface ClusterMarkerProps extends Omit<MarkerProps, 'children' | 'onClick'> {
  count: number;
  color?: string;
  size?: number;
  /** Click handler for the cluster bubble. */
  onClick?: () => void;
}

/**
 * Default cluster bubble — color and size scale with `count`. Used by
 * {@link ClusterLayer} when no `renderCluster` is provided.
 */
export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  count,
  color,
  size,
  onClick,
  ...props
}) => {
  const clusterSize = size ?? (count > 500 ? 50 : count > 100 ? 40 : 30);
  const clusterColor =
    color ?? (count > 500 ? '#f28cb1' : count > 100 ? '#f1f075' : '#51bbd6');

  // Wrap onClick so the inner `<Marker>` always sees a stable identity, but
  // the latest user callback is invoked. Without this, every render of the
  // parent allocates a fresh wrapper which Marker would see as a new
  // listener identity.
  const stableOnClick = useEvent(onClick);
  const markerOnClick = useMemo<MarkerProps['onClick'] | undefined>(
    () => (onClick ? () => stableOnClick() : undefined),
    // The wrapper only needs to be regenerated when the consumer toggles
    // onClick on/off — its body always dispatches through `stableOnClick`.
    [onClick === undefined, stableOnClick],
  );

  const handleEnter = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = 'scale(1.1)';
  }, []);
  const handleLeave = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = 'scale(1)';
  }, []);

  const bubbleStyle: React.CSSProperties = {
    width: clusterSize,
    height: clusterSize,
    backgroundColor: clusterColor,
    color: count > 100 ? '#333' : 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: clusterSize * 0.4,
    boxShadow: '0 0 0 4px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.3)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease',
  };

  return (
    <Marker {...props} onClick={markerOnClick} isCluster={true}>
      <div
        style={bubbleStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {count > 999 ? '999+' : count}
      </div>
    </Marker>
  );
};
