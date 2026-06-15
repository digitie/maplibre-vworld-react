import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Marker } from './Marker';

export interface PopupProps {
  /** Unique ID prefix for the underlying marker. @default 'popup' */
  id?: string;
  /** Anchor position `[longitude, latitude]`. */
  lngLat: [number, number];
  /** Popup body. */
  children?: React.ReactNode;
  /** Fired when the close button is pressed. */
  onClose?: () => void;
  /** Show the built-in close button. @default true */
  showCloseButton?: boolean;
  /** Maximum bubble width (px). @default 280 */
  maxWidth?: number;
}

/**
 * A simple popup bubble anchored at a coordinate. Native equivalent of the web
 * `Popup` — renders arbitrary children in a card via the RN Marker.
 */
export const Popup: React.FC<PopupProps> = ({
  id = 'popup',
  lngLat,
  children,
  onClose,
  showCloseButton = true,
  maxWidth = 280,
}) => {
  return (
    <Marker id={`${id}-popup`} lngLat={lngLat}>
      <View style={[styles.bubble, { maxWidth }]}>
        {showCloseButton ? (
          <TouchableOpacity
            style={styles.close}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  content: { paddingRight: 12 },
  close: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: { fontSize: 12, color: '#666' },
});
