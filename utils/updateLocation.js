import * as Location from "expo-location";
import { sendRiderLocation } from "../config/socketConfig";

const startLocationTracking = async (riderId) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000 , // every 60 sec
      distanceInterval: 0, // or 20 meters
    },
    (loc) => {
      const { latitude, longitude } = loc.coords;
      console.log("📍 New rider location:", latitude, longitude);
      sendRiderLocation(riderId, latitude, longitude);
    }
  );
};

export default startLocationTracking;
