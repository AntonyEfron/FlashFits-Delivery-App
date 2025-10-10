import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Demo: this can be a real MapView, add map integrations as needed
const FakeMap = () => (
  <View style={styles.mapContainer}>
    {/* Simulate map with a blueish color */}
  </View>
);

interface ReachPickupProps {
  onNext: () => void;
}

const ReachPickup: React.FC<ReachPickupProps> = ({ onNext }) => {
  return (
    <View style={styles.root}>
      <FakeMap />
      <View style={styles.sheet}>
        <Text style={styles.locationLabel}>SELECT PICKUP LOCATION</Text>
        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressTitle}>Rudrampeta</Text>
            <Text style={styles.addressDetails}>
              Rudrampeta, Anantapur, Andhra Pradesh, India
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Reach Pickup Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  mapContainer: {
    flex: 1,
    backgroundColor: '#dbeafe',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  locationLabel: {
    color: '#949494',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  addressTitle: {
    color: '#111827',
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 2,
  },
  addressDetails: {
    color: '#555',
    fontFamily: 'System',
    fontSize: 14,
    width: 240,
  },
  changeText: {
    color: '#ee6e46',
    fontWeight: '700',
    fontSize: 14,
    padding: 8,
  },
  button: {
    backgroundColor: '#ff5035',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 0,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#ee6e46',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default ReachPickup;
