import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onNext: () => void;
};

export default function ReachReturnLocation({ onNext }: Props) {
  return (
    <View style={styles.root}>
      {/* Map or placeholder */}
      <View style={styles.mapContainer} />

      {/* Route instruction text */}
      <View style={styles.routeInstructionContainer}>
        <Text style={styles.routeInstructionText}>Take the route to return location</Text>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <Text style={styles.locationLabel}>RETURN LOCATION</Text>

        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressTitle}>
              Warehouse Hub
            </Text>
            <Text style={styles.addressDetails}>456 Industrial Park, Sector 5</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Return Location Reached</Text>
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
  routeInstructionContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  routeInstructionText: {
    backgroundColor: '#fff',
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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