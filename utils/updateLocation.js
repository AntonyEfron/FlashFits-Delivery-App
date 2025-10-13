import * as Location from "expo-location";
import { sendRiderLocation } from "../config/socketConfig";

let locationSubscription = null;

export const startLocationTracking = async (riderId) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  // Prevent duplicate watchers
  if (locationSubscription) {
    console.log("📡 Location tracking already active");
    return;
  }

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // every 10 sec
      distanceInterval: 0,
    },
    (loc) => {
      const { latitude, longitude } = loc.coords;
      console.log("📍 New rider location:", latitude, longitude);
      sendRiderLocation(riderId, latitude, longitude);
    }
  );
  console.log("✅ Location tracking started");
};

export const stopLocationTracking = async () => {
  if (locationSubscription) {
    await locationSubscription.remove();
    locationSubscription = null;
    console.log("🛑 Location tracking stopped");
  } else {
    console.log("⚠️ No active location watcher");
  }
};
