import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { emitter } from "../../config/socketConfig";
import ReturnItemCamera from "./ReturnItemCamera";

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
function resolveStep(deliveryRiderStatus: string | undefined, orderStatus: string | undefined): number {
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
      // During try phase, check if customer already made their selection
      if (orderStatus === "selection_made" || orderStatus === "return_in_progress") {
        return 5; // Go to return verification
      }
      return 4; // Still in try period
    case "returning":
      return 7;
    case "at_merchant_return":
      return 8;
    case "completed":
      return 9;
    default:
      return 0; // unassigned/queued — show accept
  }
}

const OrderFlow: React.FC = () => {
  const router = useRouter();
  const { step } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(parseInt(step as string) || 0);
  const [order, setOrder] = useState<any>(null);
  const [stepLoaded, setStepLoaded] = useState(false);

  // Persist step to SecureStore whenever it changes
  const persistAndSetStep = useCallback((newStep: number) => {
    setCurrentStep(newStep);
    SecureStore.setItemAsync("orderStep", String(newStep)).catch(() => {});
  }, []);

  // Memoized callbacks to prevent child re-renders
  const goToStep = useCallback((s: number) => () => persistAndSetStep(s), [persistAndSetStep]);

  const handleDeliveryNext = useCallback((route: "earnings" | "returnVerification") => {
    persistAndSetStep(route === "earnings" ? 9 : 5);
  }, [persistAndSetStep]);

  const handleFinish = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("acceptOrder");
      await SecureStore.deleteItemAsync("currentOrderId");
      await SecureStore.deleteItemAsync("orderStep");
      await SecureStore.deleteItemAsync("status");
      await SecureStore.deleteItemAsync("startTime");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    router.push("/(home)");
  }, [router]);

  // Load order data AND persisted step from SecureStore on mount
  useEffect(() => {
    const fetchSavedState = async () => {
      try {
        // Load order
        const savedOrderStr = await SecureStore.getItemAsync("acceptOrder");
        if (savedOrderStr) {
          const parsedOrder = JSON.parse(savedOrderStr);
          if (parsedOrder.orderId && !parsedOrder._id) {
            parsedOrder._id = parsedOrder.orderId;
          }
          setOrder(parsedOrder);
        }

        // Load persisted step (only if not passed via params)
        if (!step) {
          const savedStep = await SecureStore.getItemAsync("orderStep");
          if (savedStep) {
            const parsedStep = parseInt(savedStep, 10);
            if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 9) {
              setCurrentStep(parsedStep);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load saved state in OrderFlow:", err);
      } finally {
        setStepLoaded(true);
      }
    };
    fetchSavedState();
  }, []);

  // Listen for order updates via socket — handles all status transitions
  useEffect(() => {
    const handleOrderUpdate = async (payload: any) => {
      const incomingStatus = payload.deliveryRiderStatus;
      const incomingOrderStatus = payload.orderStatus;

      // Resolve what step this status maps to
      const targetStep = resolveStep(incomingStatus, incomingOrderStatus);

      // Only advance forward, never go backward from delayed events
      setCurrentStep((prev) => {
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
        if (!payload.cutomerAddress && prevOrder?.cutomerAddress) merged.cutomerAddress = prevOrder.cutomerAddress;
        if (!payload.customerLocation && prevOrder?.customerLocation) merged.customerLocation = prevOrder.customerLocation;
        if (!payload.deliveryAmount && prevOrder?.deliveryAmount) merged.deliveryAmount = prevOrder.deliveryAmount;

        // Persist merged order
        SecureStore.setItemAsync("acceptOrder", JSON.stringify(merged)).catch(() => {});

        return merged;
      });
    };

    emitter.on("orderUpdate", handleOrderUpdate);
    return () => {
      emitter.off("orderUpdate", handleOrderUpdate);
    };
  }, []);

  // Don't render until we've loaded the persisted step
  if (!stepLoaded) return null;

  // Render ONLY the current screen — no wasted mounts
  const currentScreen = (() => {
    switch (currentStep) {
      case 0: return <AcceptOrder key="accept" onNext={goToStep(1)} />;
      case 1: return <ReachPickup key="reachPickup" onNext={goToStep(2)} />;
      case 2: return <PickupDetails key="pickupDetails" onNext={goToStep(3)} />;
      case 3: return <ReachDeliveryLocation key="reachDelivery" onNext={goToStep(4)} />;
      case 4: return <DeliveryDetails key="deliveryDetails" onNext={handleDeliveryNext} orderStatus={order?.orderStatus} />;
      case 5: return <ReturnVerification key="returnVerify" onNext={goToStep(6)} orderId={order?._id} />;
      case 6: return <ReturnItemCamera key="returnCamera" onNext={goToStep(7)} orderId={order?._id} />;
      case 7: return <ReachReturnLocation key="reachReturn" onNext={goToStep(8)} order={order} />;
      case 8: return <MerchantReturnVerification key="merchantVerify" onNext={goToStep(9)} order={order} />;
      case 9: return <EarningsSummary key="earnings" onFinish={handleFinish} order={order} />;
      default: return <AcceptOrder key="accept" onNext={goToStep(1)} />;
    }
  })();

  return <>{currentScreen}</>;
};

export default OrderFlow;
