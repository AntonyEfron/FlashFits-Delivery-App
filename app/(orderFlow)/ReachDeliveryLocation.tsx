import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onNext: () => void;
};

export default function ReachDeliveryLocation({ onNext }: Props) {
  return (
    <View style={styles.root}>
      {/* Map or placeholder */}
      <View style={styles.mapContainer} />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <Text style={styles.locationLabel}>DELIVERY LOCATION</Text>

        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressTitle}>
              John Smith
            </Text>
            <Text style={styles.addressDetails}>123 Main Street, Downtown</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Customer Location Reached</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
