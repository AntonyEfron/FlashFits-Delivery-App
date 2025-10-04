// hooks/useLocationPermission.js
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Linking, Alert, BackHandler } from "react-native";

export const useLocationPermission = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

        if (newStatus !== "granted") {
          Alert.alert(
            "Location Required",
            "Please enable location permission to continue using the app.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Exit App", onPress: () => BackHandler.exitApp() },
            ]
          );
          return;
        }
      }
      setHasPermission(true);
    })();
  }, []);

  return hasPermission;
};
