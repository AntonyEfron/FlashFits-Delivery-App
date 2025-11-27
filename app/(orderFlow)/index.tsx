import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
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

const OrderFlow: React.FC = () => {
  // const { order } = useLocalSearchParams();
  const router = useRouter();
  const { step } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(parseInt(step as string) || 0);

  const handleDeliveryNext = (route: "earnings" | "returnVerification") => {
    if (route === "earnings") setCurrentStep(9);
    else setCurrentStep(5);
  };

  const [order, setOrder] = useState<any>(null);

  const screens = [
    <AcceptOrder key="accept" onNext={() => setCurrentStep(1)} />,
    <ReachPickup key="reachPickup" onNext={() => setCurrentStep(2)} />,
    <PickupDetails key="pickupDetails" onNext={() => setCurrentStep(3)} />,
    <ReachDeliveryLocation key="reachDelivery" onNext={() => setCurrentStep(4)} />,
    <DeliveryDetails key="deliveryDetails" onNext={handleDeliveryNext} orderStatus={order?.orderStatus} />,
    <ReturnVerification key="returnVerify" onNext={() => setCurrentStep(6)} orderId={order?._id} />,
    <ReturnItemCamera key="returnCamera" onNext={() => setCurrentStep(7)} orderId={order?._id} />,
    <ReachReturnLocation key="reachReturn" onNext={() => setCurrentStep(8)} order={order} />,
    <MerchantReturnVerification key="merchantVerify" onNext={() => setCurrentStep(9)} />,
    <EarningsSummary key="earnings" onFinish={() => router.push("/(home)")} />,
  ];

  // ✅ Listen for "orderAssigned" socket event
  useEffect(() => {
    const handleOrder = (payload: any) => {

      console.log("📦 Received order on screen:", payload);
      if(payload.orderStatus === "completed try phase") {
        setCurrentStep(5);
      }
      else if(payload.orderStatus === "complete") {
        setCurrentStep(9);
      }
     
      setOrder(payload);
      

      // Navigate to OrderFlow
      // router.push("/(orderFlow)"); // adjust route if needed
    };

    emitter.on("orderUpdate", handleOrder);

    return () => {
      emitter.off("orderUpdate", handleOrder);
    };
  }, []);

  return <>{screens[currentStep]}</>;
};

export default OrderFlow;
