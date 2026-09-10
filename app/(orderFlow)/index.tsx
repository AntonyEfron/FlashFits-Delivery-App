import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import AcceptOrder from "./AcceptOrder";
import ReachPickup from "./ReachPickup";
import PickupDetails from "./PickupDetails";
import DeliveryDetails from "./DeliveryDetails";
import EarningsSummary from "./EarningsSummary";
import ReachDeliveryLocation from "./ReachDeliveryLocation";
import ReturnVerification from "./ReturnVerification";
import ReachReturnLocation from "./ReachReturnLocation";
import MerchantReturnVerification from "./MerchantReturnVerification";
import { emitter, clearCurrentOrder, connectRiderSocket } from "../../config/socketConfig";
import { forceStopAlert } from "../../utils/alertManager";
import ReturnItemCamera from "./ReturnItemCamera";
import DeviceReadinessModal from "@/components/HomeScreen/DeviceReadinessModal";
import { checkDeviceReadiness } from "@/services/readinessService";
import { startLocationTracking, sendImmediateLocation } from "@/utils/updateLocation";

/**
 * Step mapping:
 * 0 = AcceptOrder
 * 1 = ReachPickup (en_route_pickup)
 * 2 = PickupDetails (at_pickup — verify OTP)
 * 3 = ReachDeliveryLocation (en_route_delivery)
 * 4 = DeliveryDetails (at_delivery / try_phase — handover + try period)
 * 5 = ReturnVerification (customer OTP for return)
 * 6 = ReturnItemCamera (photo evidence)
 * 7 = ReachReturnLocation (returning — heading back to merchant)
 * 8 = MerchantReturnVerification (at_merchant_return — verify merchant OTP)
 * 9 = EarningsSummary (completed)
 */

/**
 * Maps deliveryRiderStatus + orderStatus to the correct step number.
 * Used for both initial navigation AND socket-driven resume.
 */
function resolveStep(
  deliveryRiderStatus: string | undefined, 
  orderStatus: string | undefined,
  otp: string | null | undefined,
  deliveryFeeRecovery?: any,
  currentStep?: number
): number {
  switch (deliveryRiderStatus) {
    case "assigned":
    case "en_route_pickup":
      // If merchant already packed, go straight to pickup details
      return orderStatus === "packed" ? 2 : 1;
    case "at_pickup":
      return 2;
    case "picked_up":
    case "en_route_delivery":
      return 3;
    case "at_delivery":
      return 4;
    case "try_phase":
      // Always stay on Step 4 (DeliveryDetails) during try phase.
      // The rider completes the strict 3-stage flow on Step 4:
      // 1. Customer OTP -> 2. Verification Photo -> 3. Cash / Payment Resolution
      return 4;
    case "returning":
      // If the rider is currently on Step 4 (DeliveryDetails), DO NOT jump to Step 7 via socket.
      // The rider MUST complete the 3-stage flow on Step 4:
      // 1. Customer OTP -> 2. Verification Photo -> 3. Cash / Payment Resolution
      if (currentStep === 4) {
        return 4;
      }
      return 7; // Heading back to merchant
    case "at_merchant_return":
      return 8;
    case "completed":
      return 9;
    default:
      return 0; // unassigned/queued — show accept
  }
}

export const safeParseStep = (val: any): number => {
  if (val === undefined || val === null) return 0;
  try {
    const raw = typeof val === "string" && val.startsWith('"') ? JSON.parse(val) : val;
    const num = parseInt(String(raw), 10);
    return isNaN(num) ? 0 : num;
  } catch {
    const num = parseInt(String(val), 10);
    return isNaN(num) ? 0 : num;
  }
};

const OrderFlow: React.FC = () => {
  const router = useRouter();
  const { step } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(safeParseStep(step) || 0);
  const [order, setOrder] = useState<any>(null);
  const [stepLoaded, setStepLoaded] = useState(false);

  // Persist step to SecureStore whenever it changes
  const persistAndSetStep = useCallback((newStep: number) => {
    setCurrentStep(newStep);
    SecureStore.setItemAsync("orderStep", String(newStep)).catch(() => {});
  }, []);

  // Memoized callbacks to prevent child re-renders
  const goToStep = useCallback((s: number) => () => persistAndSetStep(s), [persistAndSetStep]);

  const handleDeliveryNext = useCallback((route: "earnings" | "returnLocation") => {
    if (route === "earnings") {
      persistAndSetStep(9);
    } else {
      SecureStore.getItemAsync("acceptOrder").then((stored) => {
        if (stored) {
          try {
            setOrder(JSON.parse(stored));
          } catch {}
        }
      }).catch(() => {});
      persistAndSetStep(7);
    }
  }, [persistAndSetStep]);

  const handleFinish = useCallback(async () => {
    try {
      forceStopAlert();
      await clearCurrentOrder();
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    router.replace("/(home)");
  }, [router]);

  // Load order data and persisted step
  const reloadOrderState = useCallback(async () => {
    try {
      const savedOrderStr = await SecureStore.getItemAsync("acceptOrder");
      if (savedOrderStr) {
        const parsedOrder = JSON.parse(savedOrderStr);
        if (parsedOrder.orderId && !parsedOrder._id) {
          parsedOrder._id = parsedOrder.orderId;
        }
        setOrder(parsedOrder);
      }

      if (step !== undefined && step !== null) {
        const parsedStep = safeParseStep(step);
        if (parsedStep >= 0 && parsedStep <= 9) {
          setCurrentStep(parsedStep);
        }
      } else {
        const savedStep = await SecureStore.getItemAsync("orderStep");
        if (savedStep) {
          const parsedStep = safeParseStep(savedStep);
          if (parsedStep >= 0 && parsedStep <= 9) {
            setCurrentStep(parsedStep);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load saved state in OrderFlow:", err);
    } finally {
      setStepLoaded(true);
    }
  }, [step]);

  useEffect(() => {
    reloadOrderState();
  }, [step, reloadOrderState]);

  // ── Active Order Device Readiness Watchdog ──
  const [isReadinessModalVisible, setIsReadinessModalVisible] = useState(false);

  const verifyReadinessForActiveOrder = useCallback(async () => {
    // Only enforce strict blocker if an active order is in progress (steps 1 to 8)
    const stepStr = await SecureStore.getItemAsync("orderStep");
    const stepNum = stepStr ? safeParseStep(stepStr) : currentStep;
    if (stepNum <= 0 || stepNum >= 9) {
      setIsReadinessModalVisible(false);
      return true;
    }

    try {
      const readiness = await checkDeviceReadiness();
      if (!readiness.allPassed) {
        console.log("⚠️ Active order watchdog: Required settings revoked mid-delivery!", readiness);
        setIsReadinessModalVisible(true);
        return false;
      } else {
        setIsReadinessModalVisible(false);
        return true;
      }
    } catch (err) {
      console.warn("Error checking active order readiness:", err);
      return true;
    }
  }, [currentStep]);

  const handleReadinessReady = useCallback(async () => {
    setIsReadinessModalVisible(false);
    const riderId = await SecureStore.getItemAsync("deliveryRiderId");
    if (riderId) {
      connectRiderSocket(riderId);
      startLocationTracking(riderId);
    }
  }, []);

  const appState = useRef(AppState.currentState);

  // Monitor AppState (foreground/background changes) during order flow
  useEffect(() => {
    verifyReadinessForActiveOrder();

    const subscription = AppState.addEventListener("change", async (nextState) => {
      const isComingToForeground =
        appState.current.match(/inactive|background/) && nextState === "active";
      appState.current = nextState;

      if (isComingToForeground) {
        const passed = await verifyReadinessForActiveOrder();
        if (passed) {
          const riderId = await SecureStore.getItemAsync("deliveryRiderId");
          if (riderId) {
            connectRiderSocket(riderId);
            startLocationTracking(riderId);
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [verifyReadinessForActiveOrder]);

  // Periodic check (every 12 seconds) while active order is on screen
  // (Catches pulldown quick-settings GPS toggles on Android without AppState change)
  useEffect(() => {
    if (currentStep <= 0 || currentStep >= 9) return;

    const interval = setInterval(() => {
      verifyReadinessForActiveOrder();
    }, 12000);

    return () => clearInterval(interval);
  }, [currentStep, verifyReadinessForActiveOrder]);

  // Also listen for real-time orderAssigned in OrderFlow
  useEffect(() => {
    const handleOrderAssigned = async (payload: any) => {
      if (!payload || payload.orderStatus === "completed" || payload.orderStatus === "cancelled") return;

      // Guard: If order is already accepted or delivery is already in progress, NEVER reset to step 0!
      const isAlreadyAccepted =
        payload.deliveryRiderStatus &&
        !["queued", "unassigned"].includes(payload.deliveryRiderStatus);

      const storedStepStr = await SecureStore.getItemAsync("orderStep");
      const storedStep = safeParseStep(storedStepStr);

      if (isAlreadyAccepted || storedStep > 0 || currentStep > 0) {
        console.log(
          `ℹ️ OrderFlow: Ignoring orderAssigned step 0 reset — order status: ${payload.deliveryRiderStatus}, step: ${storedStep || currentStep}`
        );
        forceStopAlert();
        return;
      }

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
          payload?.pickupAddress ||
          "Store / Merchant",
        deliveryAmount: totalEarnings > 0 ? totalEarnings : (payload?.deliveryAmount || 0),
        deliveryCharge: dCharge,
        originalDeliveryCharge: payload?.originalDeliveryCharge || dCharge,
        returnCharge: rCharge,
        originalReturnCharge: payload?.originalReturnCharge || rCharge,
        tip: dTip,
        deliveryTip: dTip,
        finalBilling: payload?.finalBilling,
        shopName: payload?.merchantId?.shopName || payload?.warehouseDetails?.name || payload?.shopName || "Unknown Shop",
        items: payload?.items,
        deliveryDistance: payload?.deliveryDistance,
        customerLocation: payload?.customerLocation,
        cutomerAddress: payload?.cutomerAddress || payload?.deliveryLocation?.addressLine1 || "No address",
        customerPhone,
        customerName,
        deliveryLocation: payload?.deliveryLocation,
      };
      setOrder(orderData);
      setCurrentStep(0);
      setStepLoaded(true);
    };

    emitter.on("orderAssigned", handleOrderAssigned);
    return () => {
      emitter.off("orderAssigned", handleOrderAssigned);
    };
  }, [currentStep]);

  // Listen for order updates via socket — handles all status transitions
  useEffect(() => {
    const handleOrderUpdate = async (payload: any) => {
      const incomingStatus = payload.deliveryRiderStatus;
      const incomingOrderStatus = payload.orderStatus;

      // Resolve what step this status maps to
      const targetStep = resolveStep(incomingStatus, incomingOrderStatus, payload.otp, payload.deliveryFeeRecovery, currentStep);

      // Only advance forward, never go backward from delayed events
      setCurrentStep((prev) => {
        // Guard: If rider is on DeliveryDetails (Step 4), do not auto-advance to Step 7 (returning) via socket.
        // DeliveryDetails will explicitly call handleDeliveryNext("returnLocation") once cash is collected!
        if (prev === 4 && targetStep === 7) {
          return 4;
        }
        const newStep = Math.max(prev, targetStep);
        // Persist the step
        SecureStore.setItemAsync("orderStep", String(newStep)).catch(() => {});
        return newStep;
      });

      // Merge with existing order, preserving locally-stored fields
      setOrder((prevOrder: any) => {
        const merged = { ...prevOrder, ...payload };
        // Ensure _id exists
        merged._id = payload._id || payload.orderId || prevOrder?._id;
        merged.orderId = merged._id;
        // Preserve fields the backend doesn't include in updates
        if (!payload.shopName && prevOrder?.shopName) merged.shopName = prevOrder.shopName;
        if (!payload.pickupLocation && prevOrder?.pickupLocation) merged.pickupLocation = prevOrder.pickupLocation;
        if (!payload.pickupLocationCorrdinates && prevOrder?.pickupLocationCorrdinates) merged.pickupLocationCorrdinates = prevOrder.pickupLocationCorrdinates;
        if (!payload.merchantId && prevOrder?.merchantId) merged.merchantId = prevOrder.merchantId;
        if (!payload.pickupAddress && prevOrder?.pickupAddress) merged.pickupAddress = prevOrder.pickupAddress;
        if (!payload.cutomerAddress && prevOrder?.cutomerAddress) merged.cutomerAddress = prevOrder.cutomerAddress;
        if (!payload.customerLocation && prevOrder?.customerLocation) merged.customerLocation = prevOrder.customerLocation;
        if (!payload.customerPhone && prevOrder?.customerPhone) merged.customerPhone = prevOrder.customerPhone;
        if (!payload.customerName && prevOrder?.customerName) merged.customerName = prevOrder.customerName;
        if (!payload.deliveryLocation && prevOrder?.deliveryLocation) merged.deliveryLocation = prevOrder.deliveryLocation;
        if (!payload.deliveryAmount && prevOrder?.deliveryAmount) merged.deliveryAmount = prevOrder.deliveryAmount;
        if (!payload.deliveryCharge && prevOrder?.deliveryCharge) merged.deliveryCharge = prevOrder.deliveryCharge;
        if (!payload.returnCharge && prevOrder?.returnCharge) merged.returnCharge = prevOrder.returnCharge;
        if (!payload.tip && prevOrder?.tip) merged.tip = prevOrder.tip;
        if (!payload.deliveryTip && prevOrder?.deliveryTip) merged.deliveryTip = prevOrder.deliveryTip;
        if (!payload.finalBilling && prevOrder?.finalBilling) merged.finalBilling = prevOrder.finalBilling;

        // Persist merged order
        SecureStore.setItemAsync("acceptOrder", JSON.stringify(merged)).catch(() => {});

        return merged;
      });
    };

    emitter.on("orderUpdate", handleOrderUpdate);
    return () => {
      emitter.off("orderUpdate", handleOrderUpdate);
    };
  }, [currentStep]);

  // Don't render until we've loaded the persisted step
  if (!stepLoaded) return null;

  // Render ONLY the current screen — no wasted mounts
  const currentScreen = (() => {
    switch (currentStep) {
      case 0: return <AcceptOrder key="accept" order={order} onNext={goToStep(order?.orderStatus === "packed" ? 2 : 1)} />;
      case 1: return <ReachPickup key="reachPickup" onNext={goToStep(2)} />;
      case 2: return <PickupDetails key="pickupDetails" onNext={goToStep(3)} />;
      case 3: return <ReachDeliveryLocation key="reachDelivery" onNext={goToStep(4)} />;
      case 4: return <DeliveryDetails key="deliveryDetails" onNext={handleDeliveryNext} orderStatus={order?.orderStatus} />;
      case 5: return <ReturnVerification key="returnVerify" onNext={goToStep(7)} orderId={order?._id} order={order} />;
      case 6: return <ReturnVerification key="returnVerify6" onNext={goToStep(7)} orderId={order?._id} order={order} />;
      case 7: return <ReachReturnLocation key="reachReturn" onNext={goToStep(8)} order={order} />;
      case 8: return <MerchantReturnVerification key="merchantVerify" onNext={goToStep(9)} order={order} />;
      case 9: return <EarningsSummary key="earnings" onFinish={handleFinish} order={order} />;
      default: return <AcceptOrder key="accept" order={order} onNext={goToStep(order?.orderStatus === "packed" ? 2 : 1)} />;
    }
  })();

  return (
    <>
      {currentScreen}
      <DeviceReadinessModal
        visible={isReadinessModalVisible}
        dismissible={false}
        title="Active Order: GPS Required"
        subtitle={`You have an active delivery in progress${order?._id ? ` (#${order._id.toString().slice(-5)})` : ""}. Turn device GPS back ON and ensure location permissions are granted to continue.`}
        primaryBtnText="Resume Delivery"
        onClose={() => {}}
        onReady={handleReadinessReady}
      />
    </>
  );
};

export default OrderFlow;
