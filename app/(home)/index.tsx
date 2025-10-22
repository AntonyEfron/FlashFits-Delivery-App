import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";

import NavBarHomeScreen from "@/components/HomeScreen/NavBarHomeScreen";
import DeliveryStatusCard from "@/components/HomeScreen/DeliveryStatusCard";
import DailyProgressCard from "@/components/HomeScreen/DailyProgressCard";
import {
  connectRiderSocket,
  disconnectRiderSocket,
  emitter,
} from "../../config/socketConfig";
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/utils/updateLocation";

export default function HomeScreen() {
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // ✅ Fetch riderId once
  useEffect(() => {
    const fetchRiderId = async () => {
      const id = await SecureStore.getItemAsync("deliveryRiderId");
      console.log("🆔 Rider ID:", id);
      setRiderId(id);
    };
    fetchRiderId();
  }, []);

  // ✅ Handle Go Online / Offline
  const handleToggleOnline = async (status: boolean) => {
    setIsOnline(status);

    if (status) {
      const { status: permStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permStatus !== "granted") {
        Alert.alert(
          "Permission denied",
          "You must allow location access to go online."
        );
        setIsOnline(false);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("Location Services Off", "Please enable GPS.", [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        setIsOnline(false);
        return;
      }

      if (riderId) {
        console.log("🟢 Connecting socket for rider:", riderId);
        connectRiderSocket(riderId);
        startLocationTracking(riderId);
      }
    } else {
      console.log("🔴 Disconnecting socket & stopping tracking...");
      disconnectRiderSocket();
      await stopLocationTracking();
    }
  };

  // ✅ Listen for "orderAssigned" event and navigate
  useEffect(() => {
    const handleOrderAssigned = (payload: any) => {
      console.log("📦 Order assigned on Home:", payload);

      // Optionally store payload for later retrieval
      SecureStore.setItemAsync("currentOrder", JSON.stringify(payload));

      // Navigate to order flow page
      router.push("/(orderFlow)");
    };

    emitter.on("orderAssigned", handleOrderAssigned);

    return () => {
      emitter.off("orderAssigned", handleOrderAssigned);
    };
  }, []);

  // ✅ Basic UI
  const handleGoOnline = () => setIsOnline(true);

  return (
    <>
      <NavBarHomeScreen
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <DeliveryStatusCard
          isOnline={isOnline}
          onGoOnline={handleGoOnline}
        />
        <DailyProgressCard />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 32,
  },
});
