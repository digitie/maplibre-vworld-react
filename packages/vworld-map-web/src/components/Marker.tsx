'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import { useMap, useEvent } from '../store/hooks';
import type { MapInteractionContext } from '../VWorldMapView.web';
import type { MarkerAnchor } from '../types';

let globalMarkerZIndex = 1000;

// Hover tooltip container — static, so hoisted out of render to avoid
// reallocating the object on every render.
const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: '8px',
  backgroundColor: 'white',
  padding: '8px',
  borderRadius: '4px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  zIndex: 1000,
  width: 'max-content',
  maxWidth: '200px',
  textAlign: 'center',
  pointerEvents: 'none',
};

export interface MarkerProps {
  /** Marker position as `[longitude, latitude]`. */
  lngLat: [number, number];
  /**
   * Color of the built-in pin SVG. Ignored when `children` is provided.
   * @default '#3FB1CE'
   */
  color?: string;
  /**
   * Where the marker element anchors against the `lngLat`. Matches
   * MapLibre's [`MarkerOptions.anchor`](https://maplibre.org/maplibre-gl-js/docs/API/types/MarkerOptions/#anchor).
   *
   * - For pin-shaped content where the tip touches the coordinate, use
   *   `'bottom'`.
   * - For a centered bubble / dot, leave as `'center'` (default).
   */
  anchor?: MarkerAnchor;
  /**
   * Pixel offset `[x, y]` applied after `anchor`. Matches MapLibre's
   * `MarkerOptions.offset`.
   */
  offset?: maplibregl.PointLike;
  /** Allow the user to drag the marker. */
  draggable?: boolean;
  /** Fired after a drag ends, with the new `[lng, lat]`. */
  onDragEnd?: (lngLat: [number, number]) => void;
  /** Fired on click of the marker DOM. */
  onClick?: (event: MouseEvent, context: MapInteractionContext, marker: maplibregl.Marker) => void;
  /** Fired on right-click of the marker DOM. */
  onContextMenu?: (event: MouseEvent, context: MapInteractionContext, marker: maplibregl.Marker) => void;
  /** Visual selected state — sets `data-selected="true"` and applies a scale + shadow. */
  selected?: boolean;
  /** Visual highlighted state — sets `data-highlighted="true"` and applies a softer scale + shadow. */
  highlighted?: boolean;
  /** Title text to show in a tooltip on hover. */
  title?: string;
  /** Description text to show in a tooltip on hover. */
  description?: string;
  /** Image URL to show in a tooltip on hover. */
  imageUrl?: string;
  /** Fired when the mouse enters the marker. */
  onMouseEnter?: (event: MouseEvent, context: MapInteractionContext, marker: maplibregl.Marker) => void;
  /** Fired when the mouse leaves the marker. */
  onMouseLeave?: (event: MouseEvent, context: MapInteractionContext, marker: maplibregl.Marker) => void;
  /** Interaction ID used for context differentiation when clicked. */
  interactionId?: string;
  /** Whether this marker is a cluster (used for context source differentiation). */
  isCluster?: boolean;
  /** CSS `z-index` for stacking among other markers. */
  zIndex?: number;
  /** `aria-label` for accessibility. When set, the element also gets `role="button"`. */
  ariaLabel?: string;
  /** Additional CSS class names. */
  className?: string;
  /**
   * Custom marker content. When provided, the built-in pin SVG is replaced
   * with the children rendered via React portal into a `<div>` element.
   */
  children?: React.ReactNode;
}

function applyMarkerState(
  element: HTMLElement,
  prevClassName: string | undefined,
  {
    selected,
    highlighted,
    zIndex,
    ariaLabel,
    className,
    interactionId,
    isCluster,
  }: Pick<MarkerProps, 'selected' | 'highlighted' | 'zIndex' | 'ariaLabel' | 'className' | 'interactionId' | 'isCluster'>,
): void {
  element.dataset.selected = selected ? 'true' : 'false';
  element.dataset.highlighted = highlighted ? 'true' : 'false';
  if (interactionId !== undefined) {
    element.dataset.interactionId = interactionId;
  } else {
    delete element.dataset.interactionId;
  }
  if (isCluster) {
    element.dataset.isCluster = 'true';
  } else {
    delete element.dataset.isCluster;
  }
  element.style.zIndex = zIndex === undefined ? '' : String(zIndex);
  // MapLibre owns the root `transform` for positioning. Keep a CSS variable
  // for consumer hooks and set the individual `scale` property so selected /
  // highlighted state composes with MapLibre's transform instead of replacing it.
  const scale = selected ? '1.18' : highlighted ? '1.1' : '1';
  element.style.setProperty('--vworld-marker-scale', scale);
  element.style.setProperty('scale', scale === '1' ? '' : scale);
  element.style.filter = selected
    ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.34))'
    : highlighted
      ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.26))'
      : '';
  if (ariaLabel) {
    element.setAttribute('aria-label', ariaLabel);
    element.setAttribute('role', 'button');
  } else {
    element.removeAttribute('aria-label');
    element.removeAttribute('role');
  }
  // Token-set diff: only remove tokens that disappeared, only add tokens
  // that newly appeared. This avoids a single-frame flicker on tokens that
  // are common to the old and new className.
  const prevTokens = prevClassName
    ? prevClassName.split(/\s+/).filter(Boolean)
    : [];
  const nextTokens = className ? className.split(/\s+/).filter(Boolean) : [];
  const nextSet = new Set(nextTokens);
  for (const token of prevTokens) {
    if (!nextSet.has(token)) element.classList.remove(token);
  }
  const prevSet = new Set(prevTokens);
  for (const token of nextTokens) {
    if (!prevSet.has(token)) element.classList.add(token);
  }
}

/**
 * Renders a MapLibre marker. With no `children`, MapLibre's default pin SVG
 * is used (color customizable). With `children`, a custom DOM element hosts
 * the children via React portal.
 *
 * The MapLibre marker instance is created once per `(map, hasChildren)`
 * pair and reused across prop changes. Callbacks (`onClick`, `onDragEnd`,
 * `onContextMenu`) can change freely without re-creating the marker.
 */
export const Marker: React.FC<MarkerProps> = ({
  lngLat,
  color = '#3FB1CE',
  anchor,
  offset,
  draggable = false,
  onDragEnd,
  onClick,
  onContextMenu,
  selected,
  highlighted,
  title,
  description,
  imageUrl,
  onMouseEnter,
  onMouseLeave,
  interactionId,
  isCluster,
  zIndex,
  ariaLabel,
  className,
  children,
}) => {
  const map = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const prevClassNameRef = useRef<string | undefined>(undefined);
  const dynamicZIndexRef = useRef<number | undefined>(undefined);
  const prevZIndexPropRef = useRef(zIndex);
  const hasOnClickRef = useRef(onClick !== undefined);
  const [isHovered, setIsHovered] = React.useState(false);
  const elRef = useRef<HTMLDivElement>(null);

  // Keep the volatile interaction-context values fresh on every render. The
  // marker (and its getContext closure) is created once and reused across
  // prop changes, so reading lngLat/interactionId/isCluster directly from the
  // creation-time scope would report stale values — observable for markers
  // reused by key (e.g. ClusterLayer keyed on cluster_id) whose coordinate
  // and identity change underneath the same instance.
  const ctxRef = useRef({ lngLat, interactionId, isCluster });
  ctxRef.current = { lngLat, interactionId, isCluster };

  if (prevZIndexPropRef.current !== zIndex) {
    dynamicZIndexRef.current = undefined;
    prevZIndexPropRef.current = zIndex;
  }
  const hasOnContextMenuRef = useRef(onContextMenu !== undefined);
  const hasChildren = children !== undefined && children !== null && children !== false;

  const stableOnClick = useEvent(onClick);
  const stableOnContextMenu = useEvent(onContextMenu);
  const stableOnDragEnd = useEvent(onDragEnd);
  const stableOnMouseEnter = useEvent(onMouseEnter);
  const stableOnMouseLeave = useEvent(onMouseLeave);

  useLayoutEffect(() => {
    hasOnClickRef.current = onClick !== undefined;
    hasOnContextMenuRef.current = onContextMenu !== undefined;
  }, [onClick, onContextMenu]);

  // Stable portal container — created once per component instance (only
  // when used). SSR-safe: the effect that uses it never runs on the server.
  const container = useMemo<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null;
    return document.createElement('div');
  }, []);

  useEffect(() => {
    if (!map) return;

    const options: maplibregl.MarkerOptions = hasChildren && container
      ? { element: container, draggable, anchor, offset }
      : { color, draggable, anchor, offset };

    const marker = new maplibregl.Marker(options).setLngLat(lngLat).addTo(map);
    const element = marker.getElement();

    const getContext = (): MapInteractionContext => ({
      source: ctxRef.current.isCluster ? 'cluster' : 'marker',
      interactionId: ctxRef.current.interactionId,
      lngLat: [ctxRef.current.lngLat[0], ctxRef.current.lngLat[1]],
      defaultPrevented: false,
    });

    const handleClick = (event: MouseEvent) => {
      const baseZIndex = prevZIndexPropRef.current ?? 0;
      globalMarkerZIndex = Math.max(globalMarkerZIndex, baseZIndex) + 1;
      dynamicZIndexRef.current = globalMarkerZIndex;
      element.style.zIndex = String(dynamicZIndexRef.current);

      if (!hasOnClickRef.current) return;
      event.stopPropagation();
      stableOnClick(event, getContext(), marker);
    };
    const handleContextMenu = (event: MouseEvent) => {
      if (!hasOnContextMenuRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      stableOnContextMenu(event, getContext(), marker);
    };
    const handleMouseEnter = (event: MouseEvent) => {
      setIsHovered(true);
      stableOnMouseEnter?.(event, getContext(), marker);
    };
    const handleMouseLeave = (event: MouseEvent) => {
      setIsHovered(false);
      stableOnMouseLeave?.(event, getContext(), marker);
    };
    const handleDragEnd = () => {
      const { lng, lat } = marker.getLngLat();
      stableOnDragEnd?.([lng, lat]);
    };

    element.addEventListener('click', handleClick);
    element.addEventListener('contextmenu', handleContextMenu);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    if (draggable) marker.on('dragend', handleDragEnd);

    markerRef.current = marker;

    return () => {
      element.removeEventListener('click', handleClick);
      element.removeEventListener('contextmenu', handleContextMenu);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (draggable) marker.off('dragend', handleDragEnd);
      marker.remove();
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hasChildren, color, draggable, anchor, container]);

  // Update position when lngLat changes (cheap; no re-create needed).
  useEffect(() => {
    markerRef.current?.setLngLat(lngLat);
  }, [lngLat[0], lngLat[1]]);

  // `offset` has a setter on MapLibre's Marker, so we can update without
  // re-creating. `anchor` does not — changing it falls through to the
  // construction effect above.
  useEffect(() => {
    if (offset !== undefined) markerRef.current?.setOffset(offset);
  }, [offset]);

  // Apply visual state.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const effectiveZIndex = dynamicZIndexRef.current !== undefined
      ? dynamicZIndexRef.current
      : zIndex;

    applyMarkerState(marker.getElement(), prevClassNameRef.current, {
      selected,
      highlighted,
      zIndex: effectiveZIndex,
      ariaLabel,
      className,
      interactionId,
      isCluster,
    });
    prevClassNameRef.current = className;
  }, [selected, highlighted, zIndex, ariaLabel, className, interactionId, isCluster]);

  if (hasChildren && container) {
    return createPortal(
      <div ref={elRef} style={{ position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        {children}
        {isHovered && (title || description || imageUrl) && (
          <div style={TOOLTIP_STYLE}>
            {imageUrl && (
              <img src={imageUrl} alt={title} style={{ width: '100%', borderRadius: '2px', marginBottom: '4px' }} />
            )}
            {title && <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>{title}</div>}
            {description && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{description}</div>}
          </div>
        )}
      </div>,
      container
    );
  }
  return null;
};
