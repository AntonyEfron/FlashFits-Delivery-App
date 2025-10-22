import { useEffect, useState } from "react";
import { Redirect, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, View, Text } from "react-native";
import { useLocationPermission } from "../hooks/useLocationPermission";

export default function Index() {
  const { hasPermission, locationEnabled } = useLocationPermission();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<
    "/(home)" | "/(auth)" | "/(register)" | "/(orderFlow)" | null
  >(null);

  // ✅ Check authentication and initial redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        const verifiedStatus = true; // Replace with actual rider verification check

        if (!token) {
          setRedirectPath("/(auth)");
        } else if (verifiedStatus === false) {
          setRedirectPath("/(register)");
        } else {
          setRedirectPath("/(home)");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setRedirectPath("/(auth)");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  
  // const [order, setOrder] = useState<any>(null);

  // // ✅ Listen for "orderAssigned" socket event
  // useEffect(() => {
  //   const handleOrder = (payload: any) => {
  //     console.log("📦 Received order on screen:", payload);
  //     setOrder(payload);

  //     // Navigate to OrderFlow
  //     router.push("/orderFlow"); // adjust route if needed
  //   };

  //   emitter.on("orderAssigned", handleOrder);

  //   return () => {
  //     emitter.off("orderAssigned", handleOrder);
  //   };
  // }, []);

  // ⏳ Show loading until permissions + auth resolved
  if (!hasPermission || !locationEnabled) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Waiting for location permission...</Text>
      </View>
    );
  }

  if (isLoading || !redirectPath) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // ✅ Redirects automatically when redirectPath changes
  return <Redirect href={redirectPath} />;
}
