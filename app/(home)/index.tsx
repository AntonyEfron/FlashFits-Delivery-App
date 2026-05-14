import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";

import NavBarHomeScreen from "@/components/HomeScreen/NavBarHomeScreen";
import DeliveryStatusCard from "@/components/HomeScreen/DeliveryStatusCard";
import DailyProgressCard from "@/components/HomeScreen/DailyProgressCard";
import OrderInProgressCard from "@/components/HomeScreen/OrderInProgressCard";
import { getCurrentWeekEarnings, getRiderIncentives } from "../api/earnings";
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
  const [todayStats, setTodayStats] = useState({ earnings: 0, orders: 0 });
  const [incentives, setIncentives] = useState([]);

  // ✅ Fetch riderId once and check online status
  useEffect(() => {
    const fetchInitialData = async () => {
      const id = await SecureStore.getItemAsync("deliveryRiderId");
      console.log("🆔 Rider ID:", id);
      setRiderId(id);

      const savedOnlineStatus = await SecureStore.getItemAsync("isOnline");
      if (savedOnlineStatus === "true") {
        setIsOnline(true);
        // If they left the app while online, make sure socket connects
        if (id) {
          console.log("🟢 Reconnecting socket for rider:", id);
          connectRiderSocket(id);
          startLocationTracking(id);
        }
      }

      // Fetch today's earnings and incentives
      try {
        const [earningsRes, incentivesRes] = await Promise.allSettled([
          getCurrentWeekEarnings(),
          getRiderIncentives()
        ]);
        
        if (earningsRes.status === 'fulfilled' && earningsRes.value.success) {
          const breakdown = earningsRes.value.dailyBreakdown || [];
          const today = new Date().toISOString().split('T')[0];
          const todayData = breakdown.find((d: any) => d.date.startsWith(today));
          if (todayData) {
            setTodayStats({ earnings: todayData.totalEarnings, orders: todayData.completedOrders });
          }
        }

        if (incentivesRes.status === 'fulfilled' && incentivesRes.value.success) {
          setIncentives(incentivesRes.value.incentives || []);
        }
      } catch (err) {
        console.log("Failed to fetch dashboard stats", err);
      }
    };
    fetchInitialData();
  }, []);

  // ✅ Handle Go Online / Offline
  const handleToggleOnline = async (status: boolean) => {
    if (status === isOnline) return; // Prevent unnecessary toggles

    setIsOnline(status);
    await SecureStore.setItemAsync("isOnline", status ? "true" : "false");

    if (status) {
      const { status: permStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permStatus !== "granted") {
        Alert.alert(
          "Permission denied",
          "You must allow location access to go online."
        );
        setIsOnline(false);
        await SecureStore.setItemAsync("isOnline", "false");
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("Location Services Off", "Please enable GPS.", [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        setIsOnline(false);
        await SecureStore.setItemAsync("isOnline", "false");
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
    const handleOrderAssigned = async (payload: any) => {
      console.log("📦 Order assigned on Home:", payload);

      console.log("✅ Payload order data:", payload);

      // Extract only pickup and delivery amount safely
      const orderData = {
        orderId: payload?._id,
        orderStatus: payload?.orderStatus,
        deliveryRiderStatus: payload?.deliveryRiderStatus,
        pickupLocationCorrdinates: payload?.pickupLocation,
        pickupAddress: payload?.address,
        deliveryAmount: payload?.deliveryAmount,
        shopName: payload?.merchantId?.shopName || "Unknown Shop",
        items: payload?.items,
        deliveryDistance: payload?.deliveryDistance,
        customerLocation: payload?.customerLocation,
        cutomerAddress: payload?.cutomerAddress,
        deliveryCharge: payload?.deliveryCharge,
      };

      let startStep = 0;
      const riderStatus = payload?.deliveryRiderStatus;
      if (riderStatus) {
        if (riderStatus === "assigned") {
          startStep = payload?.orderStatus === "packed" ? 2 : 1;
        } else if (riderStatus === "at_pickup") {
          startStep = 2;
        } else if (riderStatus === "picked_up" || riderStatus === "en_route_delivery") {
          startStep = 3;
        } else if (riderStatus === "at_delivery") {
          startStep = 4;
        } else if (riderStatus === "try_phase") {
          // Check if selection was made to decide if we're at return step
          if (payload?.orderStatus === "selection_made" || payload?.orderStatus === "return_in_progress") {
            startStep = 5;
          } else {
            startStep = 4;
          }
        } else if (riderStatus === "returning") {
          startStep = 7;
        } else if (riderStatus === "at_merchant_return") {
          startStep = 8;
        } else if (riderStatus === "completed") {
          startStep = 9;
        }
      }

      const status = await SecureStore.getItemAsync("status");

      if (status) {
        await SecureStore.deleteItemAsync("status");
      }
      // Store only relevant data securely
      await SecureStore.setItemAsync("acceptOrder", JSON.stringify(orderData));
      console.log("✅ Stored order data:", orderData);

      // Navigate to order flow page and pass active step
      router.push({ pathname: "/(orderFlow)", params: { step: startStep } });
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
        <DeliveryStatusCard isOnline={isOnline} onGoOnline={handleGoOnline} />

        <OrderInProgressCard />

        <DailyProgressCard 
          earnings={todayStats.earnings} 
          orders={todayStats.orders} 
          incentives={incentives} 
        />
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
