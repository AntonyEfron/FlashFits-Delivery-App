import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentLocation } from "../../utils/updateLocation";
import { ReachedReturnMerchantApi, GetActiveOrderApi } from "../api/orderFlow";
import * as SecureStore from "expo-secure-store";

type Props = {
  onNext: () => void;
  order: any;
};

// Robust coordinate extractor supporting all backend and frontend schemas
const extractMerchantCoords = (orderObj: any): { lat: number | null; lng: number | null } => {
  if (!orderObj) return { lat: null, lng: null };

  // 1. Check pickupLocation coordinates (GeoJSON [longitude, latitude])
  const pCoords = orderObj?.pickupLocation?.coordinates || orderObj?.pickupLocationCorrdinates?.coordinates;
  if (Array.isArray(pCoords) && pCoords.length >= 2 && !isNaN(Number(pCoords[0])) && !isNaN(Number(pCoords[1]))) {
    return { lat: Number(pCoords[1]), lng: Number(pCoords[0]) };
  }

  // 2. Check merchantId / warehouseId address location coordinates (GeoJSON [longitude, latitude])
  const mCoords =
    orderObj?.merchantId?.address?.location?.coordinates ||
    orderObj?.warehouseId?.address?.location?.coordinates;
  if (Array.isArray(mCoords) && mCoords.length >= 2 && !isNaN(Number(mCoords[0])) && !isNaN(Number(mCoords[1]))) {
    return { lat: Number(mCoords[1]), lng: Number(mCoords[0]) };
  }

  // 3. Check direct latitude / longitude on address objects
  const mAddr = orderObj?.merchantId?.address || orderObj?.warehouseId?.address || orderObj?.merchantDetails?.address;
  if (mAddr && mAddr.latitude != null && mAddr.longitude != null && !isNaN(Number(mAddr.latitude)) && !isNaN(Number(mAddr.longitude))) {
    return { lat: Number(mAddr.latitude), lng: Number(mAddr.longitude) };
  }

  // 4. Check pickupCoordinates or pickupCoords objects
  const pObj = orderObj?.pickupCoordinates || orderObj?.pickupCoords || orderObj?.merchantLocation;
  if (pObj && typeof pObj === "object") {
    const lat = pObj.lat ?? pObj.latitude;
    const lng = pObj.lng ?? pObj.longitude;
    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) };
    }
  }

  return { lat: null, lng: null };
};

// Formatted address resolver
const getFormattedAddress = (orderObj: any): string => {
  if (typeof orderObj?.pickupAddress === "string" && orderObj.pickupAddress.trim() && orderObj.pickupAddress !== "null") {
    return orderObj.pickupAddress;
  }
  const addr = orderObj?.merchantId?.address || orderObj?.warehouseId?.address || orderObj?.merchantDetails?.address;
  if (typeof addr === "string" && addr.trim() && addr !== "null") {
    return addr;
  }
  if (addr && typeof addr === "object") {
    const parts = [addr.street, addr.landmark, addr.city, addr.state, addr.postalCode].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }
  if (orderObj?.pickupLocation?.address) {
    return orderObj.pickupLocation.address;
  }
  return "Merchant return store";
};

// Distance calculator (Haversine formula in meters)
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

export default function ReachReturnLocation({ onNext, order: propOrder }: Props) {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(propOrder || null);
  const [fetchingFreshOrder, setFetchingFreshOrder] = useState(false);

  // Sync and enrich order data from storage and API
  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      try {
        let current = propOrder;
        const stored = await SecureStore.getItemAsync("acceptOrder");
        if (stored) {
          const parsed = JSON.parse(stored);
          current = { ...parsed, ...current };
          if (isMounted) setOrderData(current);
        }

        // Check if coordinates or shop name are missing; if so, fetch fresh active order from API
        const coords = extractMerchantCoords(current);
        const hasShopName = current?.shopName || current?.merchantId?.shopName || current?.warehouseDetails?.name;

        if (!coords.lat || !coords.lng || !hasShopName) {
          if (isMounted) setFetchingFreshOrder(true);
          const res = await GetActiveOrderApi();
          if (res?.success && res.order) {
            const fresh = res.order;
            const merged = {
              ...current,
              ...fresh,
              _id: fresh._id || current?._id,
              orderId: fresh._id || current?.orderId,
              pickupLocation: fresh.pickupLocation || current?.pickupLocation,
              merchantId: fresh.merchantId || current?.merchantId,
              shopName:
                fresh.merchantId?.shopName ||
                fresh.warehouseDetails?.name ||
                fresh.warehouseId?.name ||
                current?.shopName ||
                "Store / Merchant",
            };
            if (isMounted) {
              setOrderData(merged);
              await SecureStore.setItemAsync("acceptOrder", JSON.stringify(merged));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load return location details:", err);
      } finally {
        if (isMounted) setFetchingFreshOrder(false);
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [propOrder]);

  const coords = extractMerchantCoords(orderData);
  const shopName =
    orderData?.shopName ||
    orderData?.merchantId?.shopName ||
    orderData?.warehouseDetails?.name ||
    orderData?.warehouseId?.name ||
    orderData?.merchantDetails?.name ||
    "Return to Merchant";
  const pickupAddress = getFormattedAddress(orderData);

  const handleOpenInGoogleMaps = () => {
    if (!coords.lat || !coords.lng) {
      // Fallback to text query if GPS coordinates cannot be resolved
      const query = encodeURIComponent(`${shopName}, ${pickupAddress}`);
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert("Navigation Error", "Could not open Google Maps navigation.");
      });
      return;
    }

    const { lat, lng } = coords;

    // Platform-specific navigation links
    const navUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(navUrl).catch(() => {
      // If native navigation intent fails, fallback to web directions URL
      Linking.openURL(webFallback).catch(() => {
        Alert.alert("Navigation Error", "Failed to launch Google Maps navigation.");
      });
    });
  };

  const handleReachLocation = async () => {
    try {
      setLoading(true);
      const currentLoc = await getCurrentLocation();

      if (!currentLoc) {
        Alert.alert("Location Error", "Unable to get your current GPS location.");
        setLoading(false);
        return;
      }

      const orderId = orderData?._id || orderData?.orderId;
      if (!orderId) {
        Alert.alert("Error", "Order ID is missing.");
        setLoading(false);
        return;
      }

      // Geo-check if return coords are available
      if (coords.lat && coords.lng) {
        const distance = getDistanceFromLatLonInMeters(
          currentLoc.latitude,
          currentLoc.longitude,
          coords.lat,
          coords.lng
        );

        console.log("📏 Distance to return location:", distance.toFixed(2), "meters");

        // Aligned with backend threshold (300 meters)
        if (distance > 300) {
          Alert.alert(
            "Too Far from Store",
            `You are approximately ${Math.round(distance)} meters away from the return merchant.\nPlease reach the merchant location (within 300m) to confirm handover.`,
            [{ text: "OK" }]
          );
          setLoading(false);
          return;
        }
      }

      // Call Backend API to confirm arrival at merchant
      const result = await ReachedReturnMerchantApi({
        orderId,
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
      });

      if (result) {
        await SecureStore.setItemAsync("orderStep", "8");
        Alert.alert("Success", "Reached return location confirmed.");
        onNext();
      }
    } catch (error: any) {
      console.error("❌ Error in handleReachLocation:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to update arrival status.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Visual Header / Map Placeholder */}
      <View style={styles.mapContainer}>
        <Ionicons name="map" size={54} color="#94A3B8" />
        <Text style={styles.mapSubtext}>
          {coords.lat && coords.lng ? "GPS Location Locked" : "Loading Merchant Location..."}
        </Text>
        {fetchingFreshOrder && (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 8 }} />
        )}
      </View>

      {/* Route instruction banner */}
      <View style={styles.routeInstructionContainer}>
        <Ionicons name="arrow-undo-circle" size={24} color="#2563EB" />
        <Text style={styles.routeInstructionText}>
          Take the route back to the merchant for item handover
        </Text>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.labelRow}>
          <Text style={styles.locationLabel}>RETURN LOCATION</Text>
          {coords.lat && coords.lng ? (
            <View style={styles.coordsBadge}>
              <Ionicons name="navigate-circle" size={14} color="#10B981" />
              <Text style={styles.coordsBadgeText}>Location Ready</Text>
            </View>
          ) : (
            <View style={[styles.coordsBadge, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="alert-circle" size={14} color="#D97706" />
              <Text style={[styles.coordsBadgeText, { color: "#D97706" }]}>Address Search Mode</Text>
            </View>
          )}
        </View>

        <View style={styles.addressRow}>
          <View style={styles.storeIconContainer}>
            <Ionicons name="storefront" size={26} color="#1E293B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressTitle} numberOfLines={1}>
              {shopName}
            </Text>
            <Text style={styles.addressDetails} numberOfLines={3}>
              {pickupAddress}
            </Text>
          </View>
        </View>

        {/* Open in Google Maps Button */}
        <TouchableOpacity
          style={[styles.button, styles.mapButton]}
          onPress={handleOpenInGoogleMaps}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Open in Google Maps</Text>
        </TouchableOpacity>

        {/* Confirm Reached Location Button */}
        <TouchableOpacity
          style={[styles.button, styles.reachedButton, loading && { opacity: 0.7 }]}
          onPress={handleReachLocation}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Return Location Reached</Text>
            </View>
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
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  mapSubtext: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  routeInstructionContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeInstructionText: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  sheet: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
  },
  coordsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  coordsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 14,
  },
  storeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  addressDetails: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  mapButton: {
    backgroundColor: "#2563EB",
  },
  reachedButton: {
    backgroundColor: "#10B981",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
