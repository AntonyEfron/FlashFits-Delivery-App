import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getCurrentLocation } from "../../utils/updateLocation";
import { ReachedReturnMerchantApi } from "../api/orderFlow";
import * as SecureStore from "expo-secure-store";

type Props = {
  onNext: () => void;
  order: any;
};

export default function ReachReturnLocation({ onNext, order }: Props) {
  const [loading, setLoading] = useState(false);
  const coordinates = order?.pickupLocation?.coordinates;
  console.log(order, "order");

  console.log(coordinates, "coordinates");
 
  const handleOpenInGoogleMaps = () => {
    console.log("🚀 ~ ReachReturnLocation ~ coordinates:", coordinates);
    if (!coordinates || coordinates.length < 2) {
      Alert.alert("Error", "Coordinates not available.");
      return;
    }

    const lat = coordinates[1];
    const lng = coordinates[0];

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

  /** 🌍 Distance calculator (Haversine formula) */
  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleReachLocation = async () => {
    try {
      if (!coordinates || coordinates.length < 2) {
        Alert.alert("Error", "Return location coordinates not available.");
        return;
      }

      setLoading(true);
      const currentLoc = await getCurrentLocation();

      if (!currentLoc) {
        Alert.alert("Location Error", "Unable to get your current location.");
        setLoading(false);
        return;
      }

      const returnLat = coordinates[1];
      const returnLng = coordinates[0];

      const distance = getDistanceFromLatLonInMeters(
        currentLoc.latitude,
        currentLoc.longitude,
        returnLat,
        returnLng
      );

      console.log("📏 Distance to return location:", distance.toFixed(2), "meters");

      if (distance > 70) {
        Alert.alert("Too Far", `You are ${distance.toFixed(0)} meters away from the return location.\nYou must be within 70 meters.`, [{ text: "OK" }]);
        setLoading(false);
        return;
      }

      const orderId = order?._id || order?.orderId;
      if (!orderId) {
        Alert.alert("Error", "Order ID is missing.");
        setLoading(false);
        return;
      }

      // Call API
      const result = await ReachedReturnMerchantApi({
        orderId,
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
      });

      if (result) {
        await SecureStore.setItemAsync("orderStep", JSON.stringify("8"));
        Alert.alert("Success", "Reached return location confirmed.");
        onNext();
      }
    } catch (error) {
      console.error("❌ Error in handleReachLocation:", error);
      Alert.alert("Error", "Failed to update location.");
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleReachLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Return Location Reached</Text>
          )}
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
