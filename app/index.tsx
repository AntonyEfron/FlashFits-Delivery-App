import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<"/(home)" | "/(auth)" | "/(register)">("/(auth)");
  // const [redirectPath, setRedirectPath] = useState("/(home)");


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        const verifiedStatus = await SecureStore.getItemAsync("isVerified");

        if (!token) {
          // no token → go to login/auth
          setRedirectPath("/(auth)");
        } else if (verifiedStatus === "false") {
          // token exists but user is not verified → go to register
          setRedirectPath("/(register)");
        } else {
          // token exists & user is verified → go to home
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <Redirect href={'/(register)'} />;
}