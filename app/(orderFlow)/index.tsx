import React, { useState } from 'react';
import AcceptOrder from './AcceptOrder';
import ReachPickup from './ReachPickup';
import PickupDetails from './PickupDetails';
import DeliveryDetails from './DeliveryDetails';
import EarningsSummary from './EarningsSummary';
import ReachDeliveryLocation from './ReachDeliveryLocation';
import { useRouter } from 'expo-router';

const OrderFlow: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const router = useRouter();

  const screens = [
    <AcceptOrder key="accept" onNext={() => setStep(1)} />,
    <ReachPickup key="reach" onNext={() => setStep(2)} />,
    <PickupDetails key="pickup" onNext={() => setStep(3)} />,
    <ReachDeliveryLocation key="reachDelivery" onNext={() => setStep(4)} />,
    <DeliveryDetails key="delivery" onNext={() => setStep(5)} />,
    <EarningsSummary key="earnings" onFinish={() => router.push('/(home)')} />,
  ];

  return <>{screens[step]}</>; // remove the wrapping <View>
};

export default OrderFlow;
