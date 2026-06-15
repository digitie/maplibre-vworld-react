import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from './Marker';

export type WeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy'
  | 'foggy';

export interface WeatherMarkerProps {
  id: string;
  lngLat: [number, number];
  /** Temperature value (rounded for display). */
  temperature: number;
  condition: WeatherCondition;
  /** Temperature unit symbol. @default 'C' */
  unit?: 'C' | 'F';
  onPress?: () => void;
}

const CONDITION_ICON: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  stormy: '⛈️',
  foggy: '🌫️',
};

/** Temperature + condition chip. Native equivalent of the web `WeatherMarker`. */
export const WeatherMarker: React.FC<WeatherMarkerProps> = ({
  id,
  lngLat,
  temperature,
  condition,
  unit = 'C',
  onPress,
}) => {
  return (
    <Marker id={id} lngLat={lngLat} onPress={onPress}>
      <View style={styles.chip}>
        <Text style={styles.icon}>{CONDITION_ICON[condition]}</Text>
        <Text style={styles.temp}>
          {Math.round(temperature)}°{unit}
        </Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  icon: { fontSize: 16 },
  temp: { fontSize: 14, fontWeight: 'bold', color: '#222' },
});
