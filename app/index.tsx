import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, View, Text } from "react-native";
import { useLocationPermission } from "../hooks/useLocationPermission";

export default function Index() {
  const { hasPermission, locationEnabled } = useLocationPermission();

  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<
    "/(home)" | "/(auth)" | "/(register)"
  >("/(auth)");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        
        // const verifiedStatus = await SecureStore.getItemAsync("isVerified");
        const verifiedStatus = "true";
        console.log(token , verifiedStatus);
        

        if (!token) {
          setRedirectPath("/(auth)");
        } else if (verifiedStatus === "false") {
          console.log("herer   ss");
          
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

  // now that all hooks are declared, we can conditionally render
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <Redirect href={redirectPath} />;
}
