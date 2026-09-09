import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import {emitter} from '../config/socketConfig'
import { useEffect, useRef } from "react";
import "../utils/updateLocation";
import { forceStopAlert } from "../utils/alertManager";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function RootLayout() {
  usePushNotifications();
  const appState = useRef(AppState.currentState);

  // When app comes to foreground, stop any stale alerts from background events
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // Check if there's a pending order — if not, kill the alert
        const pendingOrderId = await SecureStore.getItemAsync("currentOrderId");
        const orderStep = await SecureStore.getItemAsync("orderStep");
        const rawStep = typeof orderStep === "string" && orderStep.startsWith('"') ? JSON.parse(orderStep) : orderStep;
        const stepNum = parseInt(String(rawStep), 10) || 0;
        // Only keep alert running if we are truly waiting to accept an order (step 0)
        if (!pendingOrderId || stepNum > 0) {
          forceStopAlert();
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}> 
        <Stack
          screenOptions={{
            headerShown: false, // hide default headers
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
