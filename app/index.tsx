//index.tsx
import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, View, Text } from "react-native";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { getRider } from "./api/auth";

export default function Index() {
  const { hasPermission, locationEnabled } = useLocationPermission();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<
    "/(home)" | "/(auth)" | "/(register)" | "/(orderFlow)" | null
  >(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        console.log(token, "token");
        
        // No token → go to login
        if (!token) {
          // console.log('notokern');
          setRedirectPath("/(auth)");
          setIsLoading(false);
          return;
        } else {
          const res = await getRider();
          console.log(res.rider, 'RODER');
          const rider = res.rider
          console.log("Verified:", rider.isVerified);
          console.log("Current Order:", rider.currentOrderId);

          // If rider has an active order → go to orderFlow immediately
          if (rider.currentOrderId) {
            setRedirectPath("/(orderFlow)");
          }
          // If not verified → go to register
          else if (!rider.isVerified) {
            setRedirectPath("/(register)");
          }
          else {
            setRedirectPath("/(home)");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setRedirectPath("/(auth)");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ⏳ Waiting for location permissions
  if (!hasPermission || !locationEnabled) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>
          Waiting for location permission...
        </Text>
      </View>
    );
  }

  // ⏳ Still loading auth + rider check
  if (isLoading || !redirectPath) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 🎯 Final Redirect
  return <Redirect href={redirectPath} />;
}
