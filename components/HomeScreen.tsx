import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from './MapView';

const HomeScreen = ({ isOnline, onToggle }) => {
  return (
    <View style={styles.screenContainer}>
      <MapView />
      <View style={styles.homeContent}>
        <Text style={styles.welcomeText}>Ready for deliveries!</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 80, // Account for top bar
  },
  homeContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
    minWidth: 120,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;