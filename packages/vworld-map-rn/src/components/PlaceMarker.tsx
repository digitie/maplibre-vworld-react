import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from './Marker';

export interface PlaceMarkerProps {
  id: string;
  lngLat: [number, number];
  title: string;
  description?: string;
  category?: string;
  photoUrl?: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Place card marker. Native equivalent of the web `PlaceMarker`. */
export const PlaceMarker: React.FC<PlaceMarkerProps> = ({
  id,
  lngLat,
  title,
  description,
  category,
  photoUrl,
  selected = false,
  onPress,
}) => {
  return (
    <Marker id={id} lngLat={lngLat} selected={selected} onPress={onPress}>
      <View style={styles.card}>
        {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photo} /> : null}
        <View style={styles.body}>
          {category ? <Text style={styles.category}>{category}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  photo: { width: '100%', height: 100 },
  body: { padding: 12 },
  category: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 12, color: '#666', lineHeight: 16 },
});
