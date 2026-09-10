import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../config/axiosConfig";
import { sendRiderLocation } from "../config/socketConfig";

const LOCATION_TASK_NAME = "background-location-task";
let isFlushing = false;

// ── 1. Task Manager Background Task Definition ──
// This must be defined at the global scope, outside components.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("🔴 Background location task error:", error.message);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const loc = locations[locations.length - 1]; // latest location
      const { latitude, longitude } = loc.coords;
      const timestamp = loc.timestamp || Date.now();

      console.log("📡 Background location update received:", latitude, longitude);

      // Attempt to send live via socket first (if app is in foreground and connected)
      try {
        const riderId = await SecureStore.getItemAsync("deliveryRiderId");
        if (riderId) {
          sendRiderLocation(riderId, latitude, longitude);
        }
      } catch (err) {
        console.warn("Socket foreground location emission failed (app likely in background):", err.message);
      }

      // Add to offline-first queue and flush
      try {
        const queueStr = await SecureStore.getItemAsync("locationQueue");
        const queue = queueStr ? JSON.parse(queueStr) : [];
        
        queue.push({ lat: latitude, lng: longitude, timestamp });
        
        // Cap the queue at 30 items to keep within SecureStore size limit (approx 2KB)
        if (queue.length > 30) {
          queue.shift();
        }

        await SecureStore.setItemAsync("locationQueue", JSON.stringify(queue));

        // Attempt to flush queue to the backend via POST API
        await flushLocationQueue();
      } catch (err) {
        console.error("Failed to queue background location:", err.message);
      }
    }
  }
});

// ── 2. Flush Location Queue (Offline & Retry Logic) ──
export const flushLocationQueue = async () => {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const riderId = await SecureStore.getItemAsync("deliveryRiderId");
    if (!riderId) {
      isFlushing = false;
      return;
    }

    const queueStr = await SecureStore.getItemAsync("locationQueue");
    if (!queueStr) {
      isFlushing = false;
      return;
    }

    let queue = JSON.parse(queueStr);
    if (queue.length === 0) {
      isFlushing = false;
      return;
    }

    console.log(`🔄 Syncing ${queue.length} locations to backend...`);

    while (queue.length > 0) {
      const currentLoc = queue[0];
      
      try {
        // Send location via REST POST API (works in background & allows offline sync)
        const response = await axiosInstance.post("/deliveryRider/order/updateLocation", {
          lat: currentLoc.lat,
          lng: currentLoc.lng,
          timestamp: currentLoc.timestamp,
        });

        if (response.status === 200 || response.data?.success) {
          // Success: pop from local array
          queue.shift();
          await SecureStore.setItemAsync("locationQueue", JSON.stringify(queue));
        } else {
          // Format/API issue, discard to prevent blocking the queue
          queue.shift();
          await SecureStore.setItemAsync("locationQueue", JSON.stringify(queue));
        }
      } catch (error) {
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error');
        if (isNetworkError) {
          console.log("🌐 Device offline. Suspending background location sync.");
          break; // Stop loop, retry on next connectivity event or update
        } else {
          // Bad request or other API error: discard and move on
          console.warn("⚠️ Discarding location update due to API error:", error.response?.data || error.message);
          queue.shift();
          await SecureStore.setItemAsync("locationQueue", JSON.stringify(queue));
        }
      }
    }
  } catch (err) {
    console.error("Error in flushLocationQueue:", err.message);
  } finally {
    isFlushing = false;
  }
};

let isStartingTracking = false;
let isSendingImmediateLocation = false;
let lastImmediateLocationTimestamp = 0;
const IMMEDIATE_LOCATION_THROTTLE_MS = 10000; // 10 seconds throttle

// ── Immediate Location Update (Single Shot) ──
export const sendImmediateLocation = async (riderId) => {
  if (!riderId) return;

  const now = Date.now();
  if (now - lastImmediateLocationTimestamp < IMMEDIATE_LOCATION_THROTTLE_MS) {
    return;
  }
  if (isSendingImmediateLocation) return;
  isSendingImmediateLocation = true;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    if (loc?.coords) {
      lastImmediateLocationTimestamp = Date.now();
      const { latitude, longitude } = loc.coords;
      console.log("📍 Immediate location update sent:", latitude, longitude);
      sendRiderLocation(riderId, latitude, longitude);

      // Also send via REST API for reliability
      axiosInstance.post("/deliveryRider/order/updateLocation", {
        lat: latitude,
        lng: longitude,
        timestamp: Date.now(),
      }).catch((e) => console.log("Immediate REST loc sync non-fatal:", e.message));
    }
  } catch (err) {
    console.warn("Could not send immediate location:", err.message);
  } finally {
    isSendingImmediateLocation = false;
  }
};

// ── 3. Start Location Tracking ──
export const startLocationTracking = async (riderId) => {
  if (!riderId) return false;
  if (isStartingTracking) return false;
  isStartingTracking = true;

  try {
    // 1. Check if background tracking task is ALREADY running first
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      return true;
    }

    // 2. Check permissions without requesting if already granted (prevents Android Activity lifecycle loops)
    let { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      const res = await Location.requestForegroundPermissionsAsync();
      foregroundStatus = res.status;
    }
    if (foregroundStatus !== "granted") {
      console.warn("⚠️ Foreground location permission denied");
      return false;
    }

    let { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    if (backgroundStatus !== "granted") {
      const res = await Location.requestBackgroundPermissionsAsync();
      backgroundStatus = res.status;
    }
    if (backgroundStatus !== "granted") {
      console.warn("⚠️ Background location permission denied");
      return false;
    }

    // Double check before launching task
    const stillStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (stillStarted) {
      return true;
    }

    // Immediately broadcast current location once so rider is added to Redis Geo right away
    sendImmediateLocation(riderId);

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // every 10 seconds
      distanceInterval: 10, // or 10 meters
      showsBackgroundLocationIndicator: true, // iOS indicator
      foregroundService: {
        notificationTitle: "FlashFits Rider",
        notificationBody: "Location tracking is active.",
        notificationColor: "#2563eb",
      },
    });
    console.log("✅ Background location tracking started");
    return true;
  } catch (error) {
    console.error("❌ Failed to start background location tracking:", error.message);
    return false;
  } finally {
    isStartingTracking = false;
  }
};

// ── 4. Stop Location Tracking ──
export const stopLocationTracking = async () => {
  try {
    const currentOrderId = await SecureStore.getItemAsync("currentOrderId");
    const isOnline = await SecureStore.getItemAsync("isOnline") === "true";

    // Keep active if rider is still online OR has an active order
    if (isOnline || currentOrderId) {
      console.log("📡 Keeping background tracking active (Online or Active Order present)");
      return;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("🛑 Background location tracking stopped");
    }
  } catch (err) {
    console.error("Error stopping location tracking:", err.message);
  }
};

// ── 5. Initialize/Resume tracking on App launch ──
export const initializeLocationTracking = async (riderId) => {
  if (!riderId) return;
  try {
    const isOnline = await SecureStore.getItemAsync("isOnline") === "true";
    const currentOrderId = await SecureStore.getItemAsync("currentOrderId");

    if (isOnline || currentOrderId) {
      console.log("🔄 App boot: Resuming background location tracking...");
      await startLocationTracking(riderId);
      await flushLocationQueue(); // flush any stored locations
    } else {
      await stopLocationTracking();
    }
  } catch (error) {
    console.error("Failed to initialize location tracking on launch:", error.message);
  }
};

// ── 6. Cleanup on Logout ──
export const clearTrackingOnLogout = async () => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    await SecureStore.deleteItemAsync("locationQueue");
    console.log("🧹 Stopped tracking and cleared location queue on logout");
  } catch (error) {
    console.error("Error clearing tracking on logout:", error.message);
  }
};

// ── Legacy/Order reached helpers (Preserved for compatibility) ──
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("⚠️ Location permission not granted");
      return null;
    }

    // Safe timeout race without rejecting promises (prevents native JSI crash)
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
    const locPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).catch(() => null);

    let location = await Promise.race([locPromise, timeoutPromise]);
    if (!location) {
      location = await Location.getLastKnownPositionAsync().catch(() => null);
    }

    if (!location?.coords) return null;
    const { latitude, longitude } = location.coords;
    return { latitude, longitude };
  } catch (error) {
    console.error("❌ Error fetching current location:", error.message);
    return null;
  }
};
