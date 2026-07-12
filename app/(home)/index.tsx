import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";

import NavBarHomeScreen from "@/components/HomeScreen/NavBarHomeScreen";
import DeliveryStatusCard from "@/components/HomeScreen/DeliveryStatusCard";
import DailyProgressCard from "@/components/HomeScreen/DailyProgressCard";
import OrderInProgressCard from "@/components/HomeScreen/OrderInProgressCard";
import { getCurrentWeekEarnings, getRiderIncentives, getTodayEarnings, getYesterdayEarnings } from "../api/earnings";
import { startOnlineSession, endOnlineSession } from "../api/session";
import {
  connectRiderSocket,
  disconnectRiderSocket,
  emitter,
} from "../../config/socketConfig";
import { GetActiveOrderApi } from "../api/orderFlow";
import {
  startLocationTracking,
  stopLocationTracking,
  initializeLocationTracking,
} from "@/utils/updateLocation";

/**
 * Maps deliveryRiderStatus + orderStatus to the correct order flow step.
 * Must stay in sync with OrderFlow/index.tsx resolveStep().
 */
function resolveStartStep(riderStatus: string, orderStatus: string): number {
  switch (riderStatus) {
    case "assigned":
    case "en_route_pickup":
      return orderStatus === "packed" ? 2 : 1;
    case "at_pickup":
      return 2;
    case "picked_up":
    case "en_route_delivery":
      return 3;
    case "at_delivery":
      return 4;
    case "try_phase":
      if (orderStatus === "selection_made" || orderStatus === "return_in_progress") return 5;
      return 4;
    case "returning":
      return 7;
    case "at_merchant_return":
      return 8;
    case "completed":
      return 9;
    default:
      return 0;
  }
}

export default function HomeScreen() {
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [todayStats, setTodayStats] = useState({ earnings: 0, orders: 0, loginHours: 0 });
  const [yesterdayStats, setYesterdayStats] = useState({ earnings: 0, orders: 0 });
  const [incentives, setIncentives] = useState([]);

  // ✅ Fetch riderId once and check online status
  useEffect(() => {
    const fetchInitialData = async () => {
      const id = await SecureStore.getItemAsync("deliveryRiderId");
      console.log("🆔 Rider ID:", id);
      setRiderId(id);

      const savedOnlineStatus = await SecureStore.getItemAsync("isOnline");
      if (savedOnlineStatus === "true") {
        // Enforce permissions before allowing them to stay online on boot
        const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
        const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();

        if (fgStatus === "granted" && bgStatus === "granted") {
          setIsOnline(true);
          // If they left the app while online, make sure socket connects
          if (id) {
            console.log("🟢 Reconnecting socket for rider:", id);
            connectRiderSocket(id);
            // Resume or create online session (idempotent)
            startOnlineSession().catch((err) =>
              console.log("Session resume on boot (non-fatal):", err.message)
            );
          }
        } else {
          console.log("⚠️ Permissions revoked while closed. Forcing offline.");
          await SecureStore.setItemAsync("isOnline", "false");
          setIsOnline(false);
          Alert.alert(
            "Permissions Revoked",
            "Location permissions were revoked. You have been taken offline.",
            [{ text: "OK" }]
          );
        }
      }

      if (id) {
        initializeLocationTracking(id);
        
        // Sync active order to fix stale orders stuck in progress
        try {
          const activeOrderRes = await GetActiveOrderApi();
          if (activeOrderRes?.success) {
            if (activeOrderRes.order) {
              const o = activeOrderRes.order;
              const orderData = {
                orderId: o?._id,
                orderStatus: o?.orderStatus,
                deliveryRiderStatus: o?.deliveryRiderStatus,
                pickupLocationCorrdinates: o?.pickupLocation,
                pickupAddress: o?.address,
                deliveryAmount: o?.deliveryAmount,
                shopName: o?.merchantId?.shopName || "Unknown Shop",
                items: o?.items,
                deliveryDistance: o?.deliveryDistance,
                customerLocation: o?.customerLocation,
                cutomerAddress: o?.cutomerAddress,
                deliveryCharge: o?.deliveryCharge,
              };
              const startStep = resolveStartStep(o.deliveryRiderStatus || "", o.orderStatus || "");
              await SecureStore.setItemAsync("acceptOrder", JSON.stringify(orderData));
              await SecureStore.setItemAsync("orderStep", String(startStep));
            } else {
              await SecureStore.deleteItemAsync("acceptOrder");
              await SecureStore.deleteItemAsync("currentOrderId");
              await SecureStore.deleteItemAsync("orderStep");
              await SecureStore.deleteItemAsync("status");
              await SecureStore.deleteItemAsync("startTime");
            }
            emitter.emit("orderSynced");
          }
        } catch (err) {
          console.log("Failed to sync active order:", err);
        }
      }

      // Fetch today's earnings, yesterday, and incentives
      try {
        const [todayRes, yesterdayRes, incentivesRes] = await Promise.allSettled([
          getTodayEarnings(),
          getYesterdayEarnings(),
          getRiderIncentives()
        ]);
        
        if (todayRes.status === 'fulfilled' && todayRes.value.success) {
          const data = todayRes.value.payout || {};
          setTodayStats({ 
            earnings: data.totalEarnings || 0, 
            orders: data.completedOrders || 0,
            loginHours: data.loginHours || 0
          });
        }

        if (yesterdayRes.status === 'fulfilled' && yesterdayRes.value.success) {
          const data = yesterdayRes.value.payout || {};
          setYesterdayStats({ earnings: data.totalEarnings || 0, orders: data.completedOrders || 0 });
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

  // ✅ Listen for socket connection status
  useEffect(() => {
    const handleConnectionStatus = ({ connected, reconnecting }: { connected: boolean; reconnecting: boolean }) => {
      setIsConnected(connected);
      setIsReconnecting(reconnecting);
    };

    emitter.on("connectionStatus", handleConnectionStatus);
    return () => {
      emitter.off("connectionStatus", handleConnectionStatus);
    };
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
          "You must allow location access to go online.",
          [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }]
        );
        setIsOnline(false);
        await SecureStore.setItemAsync("isOnline", "false");
        return;
      }

      const { status: bgPermStatus } =
        await Location.requestBackgroundPermissionsAsync();

      if (bgPermStatus !== "granted") {
        Alert.alert(
          "Background Permission Required",
          "You must allow 'Always' background location access to go online so we can track deliveries while the app is closed.",
          [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }]
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
        // Start online session on backend (fire-and-forget)
        startOnlineSession().catch((err) =>
          console.log("Session start (non-fatal):", err.message)
        );
      }
    } else {
      console.log("🔴 Disconnecting socket & stopping tracking...");
      // End online session on backend before disconnecting
      endOnlineSession().catch((err) =>
        console.log("Session end (non-fatal):", err.message)
      );
      if (riderId) {
        disconnectRiderSocket(riderId);
      } else {
        disconnectRiderSocket();
      }
      await stopLocationTracking();
    }
  };

  // ✅ Listen for "orderAssigned" event and navigate
  useEffect(() => {
    const handleOrderAssigned = async (payload: any) => {
      console.log("📦 Order assigned on Home:", payload);

      // Extract order data
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

      // Resolve start step using centralized logic
      const riderStatus = payload?.deliveryRiderStatus || "";
      const orderStatus = payload?.orderStatus || "";
      const startStep = resolveStartStep(riderStatus, orderStatus);

      // Clean up any stale status
      await SecureStore.deleteItemAsync("status");

      // Store order data + step
      await SecureStore.setItemAsync("acceptOrder", JSON.stringify(orderData));
      await SecureStore.setItemAsync("orderStep", String(startStep));
      console.log("✅ Stored order data, navigating to step:", startStep);

      // Navigate to order flow page
      router.push({ pathname: "/(orderFlow)", params: { step: startStep } });
    };

    emitter.on("orderAssigned", handleOrderAssigned);

    return () => {
      emitter.off("orderAssigned", handleOrderAssigned);
    };
  }, []);

  return (
    <>
      <NavBarHomeScreen
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
      />

      {/* Connection status banner */}
      {isOnline && !isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>
            {isReconnecting ? "🔄 Reconnecting..." : "⚠️ Disconnected"}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <DeliveryStatusCard isOnline={isOnline} onGoOnline={() => handleToggleOnline(true)} />

        <OrderInProgressCard />

        <DailyProgressCard 
          earnings={todayStats.earnings} 
          orders={todayStats.orders} 
          onlineTime={`${Math.floor(todayStats.loginHours)}h ${Math.round((todayStats.loginHours - Math.floor(todayStats.loginHours)) * 60)}m`}
          yesterdayEarnings={yesterdayStats.earnings}
          yesterdayOrders={yesterdayStats.orders}
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
  connectionBanner: {
    backgroundColor: "#fbbf24",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  connectionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#78350f",
  },
});
