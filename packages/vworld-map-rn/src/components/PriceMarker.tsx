import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from './Marker';

export interface PriceItem {
  label?: string;
  price: string | number;
  /** Currency / unit symbol; falls back to the root `currency` prop. */
  currency?: string;
}

export interface PriceMarkerProps {
  id: string;
  lngLat: [number, number];
  /** Single price or a list (e.g. multiple fuels). */
  price: string | number | PriceItem[];
  /** Currency / unit symbol shown before the price. @default '' */
  currency?: string;
  selected?: boolean;
  onPress?: () => void;
}

function formatPrice(p: string | number): string {
  return typeof p === 'number' ? p.toLocaleString() : p;
}

/** Airbnb-style price chip. Native equivalent of the web `PriceMarker`. */
export const PriceMarker: React.FC<PriceMarkerProps> = ({
  id,
  lngLat,
  price,
  currency = '',
  selected = false,
  onPress,
}) => {
  const items = Array.isArray(price) ? price : null;
  return (
    <Marker id={id} lngLat={lngLat} onPress={onPress}>
      <View style={[styles.chip, selected && styles.chipSelected]}>
        {items ? (
          items.map((p, i) => (
            <View key={i} style={styles.row}>
              {p.label ? <Text style={styles.label}>{p.label}</Text> : null}
              <Text style={[styles.price, selected && styles.priceSelected]}>
                {p.currency ?? currency}
                {formatPrice(p.price)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.price, selected && styles.priceSelected]}>
            {currency}
            {formatPrice(price as string | number)}
          </Text>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chipSelected: { backgroundColor: '#222', borderColor: '#222' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontSize: 12, color: '#666' },
  price: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  priceSelected: { color: 'white' },
});
