import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { ReachPickUpLocation } from "../api/orderFlow";
import { getCurrentLocation } from "../../utils/updateLocation";
import * as SecureStore from "expo-secure-store";

interface ReachPickupProps {
  onNext: () => void;
}

const ReachPickup: React.FC<ReachPickupProps> = ({ onNext }) => {
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const storedData = await SecureStore.getItemAsync("acceptOrder");
        if (!storedData) {
          Alert.alert("Error", "No order found in storage.");
          return;
        }
        const parsedOrder = JSON.parse(storedData);
        setOrderData(parsedOrder);
        console.log("✅ Loaded order:", parsedOrder);
      } catch (err) {
        console.error("❌ Error fetching stored order:", err);
      }
    };

    fetchOrder();
  }, []);

  /** 🧭 Static pickup coordinates */
  const pickupCoords = { lat: 9.9675883, lng: 76.2994220 };

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

  /** ✅ Handle Reach Pickup */
  const handleReachPickup = async () => {
    try {
      if (!orderData) {
        Alert.alert("Error", "Order not found.");
        return;
      }

      const orderId = orderData.orderId;
      const currentLoc = await getCurrentLocation();
      if (!currentLoc) {
        Alert.alert("Error", "Unable to fetch current location.");
        return;
      }

      const distance = getDistanceFromLatLonInMeters(
        currentLoc.latitude,
        currentLoc.longitude,
        pickupCoords.lat,
        pickupCoords.lng
      );

      console.log("📏 Distance to pickup:", distance.toFixed(2), "meters");

      if (distance > 100) {
        Alert.alert("Too Far", `You are ${distance.toFixed(0)} meters away from pickup location.`);
        return;
      }

      const result = await ReachPickUpLocation({ orderId, coordinates: pickupCoords });
      if (result) {
        await SecureStore.setItemAsync("orderStep", JSON.stringify("2"));
        Alert.alert("Success", "Reached pickup location confirmed.");
        onNext();
      }
    } catch (error) {
      console.error("❌ Error in handleReachPickup:", error);
      Alert.alert("Error", "Failed to send pickup log");
    }
  };

  /** 🗺️ Open in Google Maps */
  const openInGoogleMaps = () => {
    const { lat, lng } = pickupCoords;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Unable to open Google Maps"));
  };

  const FakeMap = () => (
    <View style={styles.mapContainer}>
      <Text style={styles.mapText}>Map Preview Disabled</Text>
      <TouchableOpacity style={styles.mapButton} onPress={openInGoogleMaps}>
        <Text style={styles.mapButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <FakeMap />
      <View style={styles.sheet}>
        <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressTitle}>
              {orderData?.shopName ? orderData.shopName : "Shop name not available"}
            </Text>
            <Text style={styles.addressDetails}>
              {orderData?.pickupAddress && orderData.pickupAddress !== "null"
                ? orderData.pickupAddress
                : "Pickup address not available"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReachPickup}>
          <Text style={styles.buttonText}>Reach Pickup Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/** 💅 Styles */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  mapContainer: {
    flex: 1,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: { color: "#6b7280", fontSize: 16, fontWeight: "600" },
  mapButton: {
    backgroundColor: "#3b82f6",
    marginHorizontal: 24,
    marginVertical: 17,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mapButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    elevation: 16,
  },
  locationLabel: { color: "#949494", fontWeight: "600", fontSize: 12, marginBottom: 10 },
  addressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  addressTitle: { color: "#111827", fontWeight: "700", fontSize: 18, marginBottom: 2 },
  addressDetails: { color: "#555", fontSize: 14, width: 240 },
  button: {
    backgroundColor: "#ff5035",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
});

export default ReachPickup;
