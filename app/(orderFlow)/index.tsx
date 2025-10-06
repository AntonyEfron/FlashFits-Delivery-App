import React, { useState } from 'react';
import AcceptOrder from './AcceptOrder';
import ReachPickup from './ReachPickup';
import PickupDetails from './PickupDetails';
import DeliveryDetails from './DeliveryDetails';
import EarningsSummary from './EarningsSummary';
import ReachDeliveryLocation from './ReachDeliveryLocation';
import ReturnVerification from './ReturnVerification';
import ReachReturnLocation from './ReachReturnLocation';
import MerchantReturnVerification from './MerchantReturnVerification';
import { useRouter } from 'expo-router';

const OrderFlow: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const router = useRouter();

  /** Handle delivery step navigation logic */
  const handleDeliveryNext = (route: 'earnings' | 'returnVerification') => {
    if (route === 'earnings') setStep(8); // direct to earnings
    else setStep(5); // go to return verification
  };

  /** Ordered screen sequence */
  const screens = [
    <AcceptOrder key="accept" onNext={() => setStep(1)} />,
    <ReachPickup key="reachPickup" onNext={() => setStep(2)} />,
    <PickupDetails key="pickupDetails" onNext={() => setStep(3)} />,
    <ReachDeliveryLocation key="reachDelivery" onNext={() => setStep(4)} />,
    <DeliveryDetails key="deliveryDetails" onNext={handleDeliveryNext} />,
    <ReturnVerification key="returnVerify" onNext={() => setStep(6)} />, // after OTP → reach return
    <ReachReturnLocation key="reachReturn" onNext={() => setStep(7)} />, // after reaching merchant → verify
    <MerchantReturnVerification key="merchantVerify" onNext={() => setStep(8)} />, // loader → earnings
    <EarningsSummary key="earnings" onFinish={() => router.push('/(home)')} />,
  ];

  return <>{screens[step]}</>;
};

export default OrderFlow;
