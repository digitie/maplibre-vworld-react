import React, { useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { VWorldMapView } from 'vworld-map-rn';

// VWorld API key is injected from the environment (EAS secret / app config /
// .env.local). Never hardcode it (AGENTS.md). When empty, the map renders with
// no key and tiles will not load — set EXPO_PUBLIC_VWORLD_API_KEY to test.
const VWORLD_API_KEY = process.env.EXPO_PUBLIC_VWORLD_API_KEY ?? '';

export default function App() {
  const [mapType, setMapType] = useState<'base' | 'satellite' | 'hybrid' | 'midnight'>('base');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VWorld MapLibre (React Native)</Text>
        <View style={styles.buttonRow}>
          <Button title="Base" onPress={() => setMapType('base')} />
          <Button title="Satellite" onPress={() => setMapType('satellite')} />
          <Button title="Hybrid" onPress={() => setMapType('hybrid')} />
          <Button title="Midnight" onPress={() => setMapType('midnight')} />
        </View>
      </View>
      <VWorldMapView
        apiKey={VWORLD_API_KEY}
        mapType={mapType}
        initialCenter={[126.9780, 37.5665]}
        initialZoom={14}
        style={styles.map}
        markers={[
          { id: '1', coordinate: [126.9780, 37.5665], title: 'Seoul City Hall' }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  map: {
    flex: 1,
  },
});
