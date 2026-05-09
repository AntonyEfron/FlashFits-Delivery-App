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
 * OrderFlow — Renders only the current step instead of mounting all 10 screens.
 * Uses useMemo + useCallback to prevent re-renders.
 */
const OrderFlow: React.FC = () => {
  const router = useRouter();
  const { step } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(parseInt(step as string) || 0);
  const [order, setOrder] = useState<any>(null);

  // Memoized callbacks to prevent child re-renders
  const goToStep = useCallback((s: number) => () => setCurrentStep(s), []);
  const handleDeliveryNext = useCallback((route: "earnings" | "returnVerification") => {
    setCurrentStep(route === "earnings" ? 9 : 5);
  }, []);
  const handleFinish = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("acceptOrder");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    router.push("/(home)");
  }, [router]);

  // Load order data from SecureStore on mount (crucial for resuming active orders!)
  useEffect(() => {
    const fetchSavedOrder = async () => {
      try {
        const savedOrderStr = await SecureStore.getItemAsync("acceptOrder");
        if (savedOrderStr) {
          const parsedOrder = JSON.parse(savedOrderStr);
          // If we have an _id or orderId, ensure it's mapped correctly for the components
          if (parsedOrder.orderId && !parsedOrder._id) {
            parsedOrder._id = parsedOrder.orderId;
          }
          setOrder(parsedOrder);
        }
      } catch (err) {
        console.error("Failed to load saved order in OrderFlow:", err);
      }
    };
    fetchSavedOrder();
  }, []);

  // Listen for order updates via socket
  useEffect(() => {
    const handleOrder = (payload: any) => {
      // Prevent backward navigation from delayed socket events
      if (payload.orderStatus === "completed try phase") {
        setCurrentStep((prev) => Math.max(prev, 5));
      } else if (payload.deliveryRiderStatus === "completed") {
        setCurrentStep((prev) => Math.max(prev, 9));
      }
      setOrder({...payload, _id: payload.orderId || payload._id}); // Ensure _id exists
    };

    emitter.on("orderUpdate", (payload) => {
      handleOrder(payload)
    });
    return () => { emitter.off("orderUpdate", handleOrder); };
  }, []);

  // Render ONLY the current screen — no wasted mounts
  const currentScreen = useMemo(() => {
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
  }, [currentStep, order, goToStep, handleDeliveryNext, handleFinish]);

  return <>{currentScreen}</>;
};

export default OrderFlow;
