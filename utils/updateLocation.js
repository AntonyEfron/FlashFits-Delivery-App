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

export const ReachPickUpLocation = async ({ orderId, coordinates }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/reachPickupLocation", {
      event: "REACH_PICKUP_LOCATION",
      timestamp: new Date().toISOString(),
      orderId,
      coordinates,
    });

    console.log("📨 ReachPickup log sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in ReachPickUpLocation:", error.response?.data || error.message);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    // Ask for permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("⚠️ Location permission not granted");
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;
    console.log("📍 Current location:", latitude, longitude);

    return { latitude, longitude };
  } catch (error) {
    console.error("❌ Error fetching current location:", error.message);
    return null;
  }
};
