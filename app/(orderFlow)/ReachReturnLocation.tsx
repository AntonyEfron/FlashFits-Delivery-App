import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";

type Props = {
  onNext: () => void;
  order: any;
};

export default function ReachReturnLocation({ onNext, order }: Props) {
  const coordinates = order?.pickupCoordinates;
  console.log(order, "order");

  console.log(coordinates, "coordinates");

  const handleOpenInGoogleMaps = () => {
    console.log("🚀 ~ ReachReturnLocation ~ coordinates:", coordinates);
    if (!coordinates?.latitude || !coordinates?.longitude) {
      Alert.alert("Error", "Coordinates not available.");
      return;
    }

    const lat = coordinates.latitude;
    const lng = coordinates.longitude;

    // Google Maps link
    const url = `https://www.google.com/maps?q=${lat},${lng}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "Unable to open Google Maps.");
        }
      })
      .catch(() => Alert.alert("Error", "Failed to open Google Maps."));
  };

  return (
    <View style={styles.root}>
      {/* Map or placeholder */}
      <View style={styles.mapContainer} />

      {/* Route instruction text */}
      <View style={styles.routeInstructionContainer}>
        <Text style={styles.routeInstructionText}>
          Take the route to return location
        </Text>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <Text style={styles.locationLabel}>RETURN LOCATION</Text>

        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressTitle}>Warehouse Hub</Text>
            <Text style={styles.addressDetails}>
              456 Industrial Park, Sector 5
            </Text>
          </View>
        </View>

        {/* ✅ Open in Google Maps Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2563EB" }]}
          onPress={handleOpenInGoogleMaps}
        >
          <Text style={styles.buttonText}>Open in Google Maps</Text>
        </TouchableOpacity>

        {/* ✅ Next Step Button */}
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Return Location Reached</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#E2E8F0",
  },
  routeInstructionContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  routeInstructionText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  sheet: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: 8,
  },
  addressRow: {
    marginBottom: 20,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  addressDetails: {
    fontSize: 14,
    color: "#475569",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
