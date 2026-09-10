import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Linking, AppState } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";

import NavBarHomeScreen from "@/components/HomeScreen/NavBarHomeScreen";
import DeliveryStatusCard from "@/components/HomeScreen/DeliveryStatusCard";
import DailyProgressCard from "@/components/HomeScreen/DailyProgressCard";
import OrderInProgressCard from "@/components/HomeScreen/OrderInProgressCard";
import DeviceReadinessModal from "@/components/HomeScreen/DeviceReadinessModal";
import { checkDeviceReadiness } from "@/services/readinessService";
import { getCurrentWeekEarnings, getRiderIncentives, getTodayEarnings, getYesterdayEarnings } from "../api/earnings";
import { startOnlineSession, endOnlineSession, getSessionHistory } from "../api/session";
import {
  connectRiderSocket,
  disconnectRiderSocket,
  emitter,
  consumePendingOrder,
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
  const [isReadinessModalVisible, setIsReadinessModalVisible] = useState(false);
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
      let shouldBeOnline = savedOnlineStatus === "true";

      // Verify with backend if admin made rider offline
      if (shouldBeOnline && id) {
        try {
          const sessionRes = await getSessionHistory(1, 1);
          // If successful response but no active session, backend considers rider offline
          if (sessionRes?.success && !sessionRes.activeSession) {
            console.log("⚠️ Backend says no active session. Forcing offline.");
            shouldBeOnline = false;
            await SecureStore.setItemAsync("isOnline", "false");
            setIsOnline(false);
          }
        } catch (err) {
          console.log("Could not verify session with backend", err);
        }
      }

      if (shouldBeOnline) {
        // Enforce readiness before allowing them to stay online on boot
        const readiness = await checkDeviceReadiness();

        if (readiness.allPassed) {
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
          console.log("⚠️ Readiness check failed on boot. Forcing offline.");
          await SecureStore.setItemAsync("isOnline", "false");
          setIsOnline(false);
          setIsReadinessModalVisible(true);
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
              const dCharge = o?.originalDeliveryCharge ?? o?.finalBilling?.deliveryCharge ?? o?.deliveryCharge ?? 0;
              const rCharge = o?.originalReturnCharge ?? o?.returnCharge ?? 0;
              const dTip = o?.finalBilling?.deliveryTip ?? o?.deliveryTip ?? o?.tip ?? 0;
              const totalEarnings = dCharge + rCharge + dTip;
              const customerPhone = o?.customerPhone || o?.deliveryLocation?.phone || o?.userId?.phoneNumber || null;
              const customerName = o?.customerName || o?.deliveryLocation?.name || o?.userId?.name || "Customer";

              const orderData = {
                orderId: o?._id,
                _id: o?._id,
                orderStatus: o?.orderStatus,
                deliveryRiderStatus: o?.deliveryRiderStatus,
                pickupLocation: o?.pickupLocation,
                pickupLocationCorrdinates: o?.pickupLocation,
                merchantId: o?.merchantId,
                pickupAddress:
                  o?.merchantId?.address?.street ||
                  (typeof o?.merchantId?.address === "string" ? o?.merchantId?.address : null) ||
                  o?.address ||
                  "Store / Merchant",
                deliveryAmount: totalEarnings > 0 ? totalEarnings : (o?.deliveryAmount || 0),
                deliveryCharge: dCharge,
                originalDeliveryCharge: o?.originalDeliveryCharge || dCharge,
                returnCharge: rCharge,
                originalReturnCharge: o?.originalReturnCharge || rCharge,
                tip: dTip,
                deliveryTip: dTip,
                finalBilling: o?.finalBilling,
                shopName: o?.merchantId?.shopName || "Unknown Shop",
                items: o?.items,
                deliveryDistance: o?.deliveryDistance,
                customerLocation: o?.customerLocation,
                cutomerAddress: o?.cutomerAddress || o?.deliveryLocation?.addressLine1 || "No address",
                customerPhone,
                customerName,
                deliveryLocation: o?.deliveryLocation,
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

  const appState = useRef(AppState.currentState);

  // ✅ Re-verify readiness and reconnect socket when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      const isComingToForeground =
        appState.current.match(/inactive|background/) && nextState === "active";
      appState.current = nextState;

      if (isComingToForeground) {
        const savedOnline = await SecureStore.getItemAsync("isOnline");
        if (savedOnline === "true") {
          const readiness = await checkDeviceReadiness();
          if (!readiness.allPassed) {
            console.log("⚠️ Settings/permissions revoked while online. Forcing offline.");
            handleToggleOnline(false);
            setIsReadinessModalVisible(true);
          } else {
            // Ensure socket is alive and registered when returning to foreground
            const activeId = riderId || (await SecureStore.getItemAsync("deliveryRiderId"));
            if (activeId) {
              connectRiderSocket(activeId);
            }
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [riderId, isOnline]);

  // ✅ Handle Go Online / Offline
  const handleToggleOnline = async (status: boolean) => {
    if (status === isOnline) return; // Prevent unnecessary toggles

    if (status) {
      const readiness = await checkDeviceReadiness();
      if (!readiness.allPassed) {
        setIsReadinessModalVisible(true);
        return;
      }

      setIsOnline(true);
      await SecureStore.setItemAsync("isOnline", "true");

      const activeRiderId = riderId || (await SecureStore.getItemAsync("deliveryRiderId"));
      if (activeRiderId) {
        if (!riderId) setRiderId(activeRiderId);
        console.log("🟢 Connecting socket for rider:", activeRiderId);
        connectRiderSocket(activeRiderId);
        startLocationTracking(activeRiderId);
        // Start online session on backend (fire-and-forget)
        startOnlineSession().catch((err) =>
          console.log("Session start (non-fatal):", err.message)
        );
      }
    } else {
      setIsOnline(false);
      await SecureStore.setItemAsync("isOnline", "false");

      console.log("🔴 Disconnecting socket & stopping tracking...");
      // End online session on backend before disconnecting
      endOnlineSession().catch((err) =>
        console.log("Session end (non-fatal):", err.message)
      );
      const activeRiderId = riderId || (await SecureStore.getItemAsync("deliveryRiderId"));
      if (activeRiderId) {
        disconnectRiderSocket(activeRiderId);
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

      // Immediately consume/clear any buffered order so it never lingers
      consumePendingOrder();

      // Guard: Never process completed or cancelled orders
      if (
        !payload ||
        payload?.orderStatus === "completed" ||
        payload?.orderStatus === "cancelled" ||
        payload?.deliveryRiderStatus === "completed" ||
        payload?.deliveryRiderStatus === "cancelled"
      ) {
        console.log("⚠️ Ignoring completed/cancelled order on Home:", payload?._id);
        return;
      }

      // Check if rider is ALREADY fulfilling an active order
      try {
        const storedOrderStr = await SecureStore.getItemAsync("acceptOrder");
        const storedStepStr = await SecureStore.getItemAsync("orderStep");
        let activeStep = 0;
        if (storedStepStr) {
          const raw = typeof storedStepStr === "string" && storedStepStr.startsWith('"')
            ? JSON.parse(storedStepStr)
            : storedStepStr;
          activeStep = parseInt(raw, 10) || 0;
        }

        if (storedOrderStr && activeStep > 0 && activeStep < 9) {
          const storedOrder = JSON.parse(storedOrderStr);
          const payloadId = String(payload._id || payload.orderId || "").trim();
          const storedId = String(storedOrder._id || storedOrder.orderId || "").trim();

          if (payloadId && storedId && payloadId === storedId) {
            console.log(`ℹ️ Home: Rider already fulfilling order ${payloadId} at step ${activeStep}. Preserving active step.`);
            router.replace({ pathname: "/(orderFlow)", params: { step: activeStep } });
            return;
          } else if (storedId) {
            console.log(`⚠️ Home: Rider is already busy fulfilling order ${storedId} at step ${activeStep}. Ignoring new offer.`);
            return;
          }
        }
      } catch (e) {
        console.warn("Home: error checking active order state:", e);
      }

      // Extract order data with complete earnings breakdown (deliveryCharge + returnCharge + tip)
      const dCharge = payload?.originalDeliveryCharge ?? payload?.finalBilling?.deliveryCharge ?? payload?.deliveryCharge ?? 0;
      const rCharge = payload?.originalReturnCharge ?? payload?.returnCharge ?? 0;
      const dTip = payload?.finalBilling?.deliveryTip ?? payload?.deliveryTip ?? payload?.tip ?? 0;
      const totalEarnings = dCharge + rCharge + dTip;
      const customerPhone = payload?.customerPhone || payload?.deliveryLocation?.phone || payload?.userId?.phoneNumber || null;
      const customerName = payload?.customerName || payload?.deliveryLocation?.name || payload?.userId?.name || "Customer";

      const orderData = {
        orderId: payload?._id,
        _id: payload?._id,
        orderStatus: payload?.orderStatus,
        deliveryRiderStatus: payload?.deliveryRiderStatus,
        pickupLocation: payload?.pickupLocation,
        pickupLocationCorrdinates: payload?.pickupLocation,
        merchantId: payload?.merchantId,
        pickupAddress:
          payload?.merchantId?.address?.street ||
          (typeof payload?.merchantId?.address === "string" ? payload?.merchantId?.address : null) ||
          payload?.address ||
          "Store / Merchant",
        deliveryAmount: totalEarnings > 0 ? totalEarnings : (payload?.deliveryAmount || 0),
        deliveryCharge: dCharge,
        originalDeliveryCharge: payload?.originalDeliveryCharge || dCharge,
        returnCharge: rCharge,
        originalReturnCharge: payload?.originalReturnCharge || rCharge,
        tip: dTip,
        deliveryTip: dTip,
        finalBilling: payload?.finalBilling,
        shopName: payload?.merchantId?.shopName || "Unknown Shop",
        items: payload?.items,
        deliveryDistance: payload?.deliveryDistance,
        customerLocation: payload?.customerLocation,
        cutomerAddress: payload?.cutomerAddress || payload?.deliveryLocation?.addressLine1 || "No address",
        customerPhone,
        customerName,
        deliveryLocation: payload?.deliveryLocation,
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

      // Navigate cleanly to order flow page
      router.replace({ pathname: "/(orderFlow)", params: { step: startStep } });
    };

    emitter.on("orderAssigned", handleOrderAssigned);

    // Check for buffered order that arrived before this listener was attached
    // (fixes race condition on cold start / app reopen)
    const pendingOrder = consumePendingOrder();
    if (pendingOrder) {
      console.log("📦 Found buffered pending order, processing...");
      handleOrderAssigned(pendingOrder);
    }

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

      {/* Pre-Flight Device Readiness Checklist Gatekeeper */}
      <DeviceReadinessModal
        visible={isReadinessModalVisible}
        onClose={() => setIsReadinessModalVisible(false)}
        onReady={() => {
          setIsReadinessModalVisible(false);
          handleToggleOnline(true);
        }}
      />
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
