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

const OrderFlow: React.FC = () => {
  const router = useRouter();
  const { step } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(parseInt(step as string) || 0);

  const handleDeliveryNext = (route: "earnings" | "returnVerification") => {
    if (route === "earnings") setCurrentStep(8);
    else setCurrentStep(5);
  };

  const screens = [
    <AcceptOrder key="accept" onNext={() => setCurrentStep(1)} />,
    <ReachPickup key="reachPickup" onNext={() => setCurrentStep(2)} />,
    <PickupDetails key="pickupDetails" onNext={() => setCurrentStep(3)} />,
    <ReachDeliveryLocation key="reachDelivery" onNext={() => setCurrentStep(4)} />,
    <DeliveryDetails key="deliveryDetails" onNext={handleDeliveryNext} />,
    <ReturnVerification key="returnVerify" onNext={() => setCurrentStep(6)} />,
    <ReachReturnLocation key="reachReturn" onNext={() => setCurrentStep(7)} />,
    <MerchantReturnVerification key="merchantVerify" onNext={() => setCurrentStep(8)} />,
    <EarningsSummary key="earnings" onFinish={() => router.push("/(home)")} />,
  ];

  return <>{screens[currentStep]}</>;
};

export default OrderFlow;
