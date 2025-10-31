import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { ReachedCustomerLocationApi } from "../api/orderFlow";
import { getCurrentLocation } from "../../utils/updateLocation";

type Props = {
  onNext: () => void;
};

export default function ReachDeliveryLocation({ onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [customerCoords, setCustomerCoords] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 9.9312, // Dummy latitude (Kochi center)
    lng: 76.2673, // Dummy longitude (Kochi center)
  });

  useEffect(() => {
    (async () => {
      try {
        const storedOrder = await SecureStore.getItemAsync("acceptOrder");
        if (storedOrder) {
          const parsed = JSON.parse(storedOrder);
          setOrder(parsed);

          // Use actual customer coordinates if available, else fallback
          if (parsed?.customerLocation?.lat && parsed?.customerLocation?.lng) {
            setCustomerCoords({
              lat: parsed.customerLocation.lat,
              lng: parsed.customerLocation.lng,
            });
          }
        }
      } catch (error) {
        console.error("Error loading order:", error);
      }
    })();
  }, []);

  const handleReachedCustomer = async () => {
    try {
      setLoading(true);
      const location = await getCurrentLocation();

      if (!location) {
        Alert.alert("Location Error", "Unable to get current location.");
        return;
      }

      const orderId = order?._id || order?.orderId;
      if (!orderId) {
        Alert.alert("Error", "Order ID missing.");
        return;
      }

      const response = await ReachedCustomerLocationApi({
        orderId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (response) {
        await SecureStore.setItemAsync("orderStep", JSON.stringify("4"));
        Alert.alert("Success", "Customer location marked successfully!");
        onNext();
      }
    } catch (error) {
      console.error("❌ Error reaching customer:", error);
      Alert.alert("Failed", "Could not update location. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInMaps = () => {
    const { lat, lng } = customerCoords;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff5035" />
        <Text style={{ marginTop: 10 }}>Loading order details...</Text>
      </View>
    );
  }

  const last4 = order?.orderId?.slice(-4)?.toUpperCase() || "N/A";

  return (
    <View style={styles.root}>
      {/* Dummy map area */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapPlaceholder}>🗺️ Map Disabled (Static View)</Text>
        <TouchableOpacity style={styles.mapButton} onPress={handleOpenInMaps}>
          <Text style={styles.mapButtonText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <Text style={styles.routeInstructionText}>
          Take the route to customer
        </Text>

        <Text style={styles.locationLabel}>DELIVERY LOCATION</Text>

        <View style={styles.addressRow}>
          <View>
            <Text style={styles.addressTitle}>
              {order?.cutomerAddress === "null"
                ? "Customer Name"
                : order?.cutomerAddress}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleReachedCustomer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#120d0dff" />
          ) : (
            <Text style={styles.buttonText}>Customer Location Reached</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  mapContainer: {
    flex: 1,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholder: {
    color: "#3b82f6",
    fontWeight: "600",
  },
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
  routeInstructionText: {
    backgroundColor: "#fff",
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 12,
    textAlign: "center",
    borderRadius: 12,
    marginBottom: 20,
  },
  locationLabel: {
    color: "#949494",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  addressTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
  },
  addressDetails: {
    color: "#555",
    fontSize: 14,
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  mapButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#ff5035",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
