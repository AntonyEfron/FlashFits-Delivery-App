import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const MapView = () => {
  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️</Text>
        <Text style={styles.mapLabel}>Map View</Text>
        <Text style={styles.mapSubLabel}>Your delivery area will appear here</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: height * 0.5,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mapSubLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MapView;