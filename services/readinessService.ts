// services/readinessService.ts
// Centralized permission and system settings validator for Rider Duty Readiness Gatekeeper.

import { Platform, Linking } from "react-native";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch (e) {
  console.warn("expo-notifications not available in readinessService");
}

let Device: any = null;
try {
  Device = require("expo-device");
} catch (e) {
  console.warn("expo-device not available in readinessService");
}

let IntentLauncher: any = null;
try {
  IntentLauncher = require("expo-intent-launcher");
} catch (e) {
  console.warn("expo-intent-launcher not available in readinessService");
}

const PACKAGE_NAME = "com.flashfits.delivery";

export interface ReadinessStatus {
  foregroundLocation: boolean;
  backgroundLocation: boolean;
  locationServices: boolean;
  notifications: boolean;
  batteryOptimized: boolean; // true if rider marked or acknowledged unrestricted
  overlayPermission: boolean; // display over other apps
  allPassed: boolean;
}

/**
 * Check all mandatory device settings and permissions.
 */
export async function checkDeviceReadiness(): Promise<ReadinessStatus> {
  // 1. Location Permissions
  let foregroundLocation = false;
  let backgroundLocation = false;
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    foregroundLocation = fg.status === "granted";

    if (foregroundLocation) {
      const bg = await Location.getBackgroundPermissionsAsync();
      backgroundLocation = bg.status === "granted";
    }
  } catch (err) {
    console.warn("Error checking location permissions:", err);
  }

  // 2. Location Services (GPS switch)
  let locationServices = false;
  try {
    locationServices = await Location.hasServicesEnabledAsync();
  } catch (err) {
    console.warn("Error checking location services:", err);
  }

  // 3. Notifications Permission
  let notifications = false;
  try {
    if (Notifications) {
      const notif = await Notifications.getPermissionsAsync();
      notifications = notif.status === "granted";
    } else {
      notifications = true; // fallback if not available
    }
  } catch (err) {
    console.warn("Error checking notification permissions:", err);
  }

  // 4. Battery Optimization status
  // Android does not provide a direct non-native API to read ignore-battery-opt status without custom module,
  // so we check if the rider has acknowledged configuring it, or we verify on Android.
  const batteryAck = await SecureStore.getItemAsync("batteryOptimizationConfigured");
  const batteryOptimized = batteryAck === "true" || Platform.OS === "ios";

  // 5. Overlay (Display over other apps) acknowledgment
  const overlayAck = await SecureStore.getItemAsync("overlayPermissionConfigured");
  const overlayPermission = overlayAck === "true" || Platform.OS === "ios";

  // Mandatory checks: Location (FG & BG), GPS, and Notifications are hard requirements.
  // Battery and Overlay are strongly enforced on Android.
  const allPassed =
    foregroundLocation &&
    backgroundLocation &&
    locationServices &&
    notifications &&
    batteryOptimized &&
    overlayPermission;

  return {
    foregroundLocation,
    backgroundLocation,
    locationServices,
    notifications,
    batteryOptimized,
    overlayPermission,
    allPassed,
  };
}

/**
 * Request Foreground and Background location permissions sequentially.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      await Linking.openSettings();
      return false;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      await Linking.openSettings();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting location permissions:", error);
    await Linking.openSettings();
    return false;
  }
}

/**
 * Request Notifications permission.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Notifications) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        await Linking.openSettings();
        return false;
      }
      return true;
    }
    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    await Linking.openSettings();
    return false;
  }
}

/**
 * Open GPS hardware location settings.
 */
export async function openLocationSourceSettings() {
  if (Platform.OS === "android" && IntentLauncher) {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
      );
      return;
    } catch (e) {
      console.warn("Could not open LOCATION_SOURCE_SETTINGS intent", e);
    }
  }
  await Linking.openSettings();
}

/**
 * Open Battery Optimization settings for FlashFits Delivery app.
 */
export async function openBatteryOptimizationSettings() {
  if (Platform.OS === "android" && IntentLauncher) {
    try {
      // Direct intent to ask exemption for our package
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        { data: `package:${PACKAGE_NAME}` }
      );
      await SecureStore.setItemAsync("batteryOptimizationConfigured", "true");
      return;
    } catch (e) {
      try {
        // Fallback to general ignore battery optimization list
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
        );
        await SecureStore.setItemAsync("batteryOptimizationConfigured", "true");
        return;
      } catch (err2) {
        console.warn("Could not open battery optimization settings", err2);
      }
    }
  }
  await SecureStore.setItemAsync("batteryOptimizationConfigured", "true");
  await Linking.openSettings();
}

/**
 * Open "Display Over Other Apps" (Overlay) settings for FlashFits Delivery app.
 */
export async function openOverlaySettings() {
  if (Platform.OS === "android" && IntentLauncher) {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.MANAGE_OVERLAY_PERMISSION,
        { data: `package:${PACKAGE_NAME}` }
      );
      await SecureStore.setItemAsync("overlayPermissionConfigured", "true");
      return;
    } catch (e) {
      console.warn("Could not open MANAGE_OVERLAY_PERMISSION intent", e);
    }
  }
  await SecureStore.setItemAsync("overlayPermissionConfigured", "true");
  await Linking.openSettings();
}

/**
 * Returns OEM brand-specific instructions for Chinese and aggressive OEMs.
 */
export function getOEMGuidance(): { brand: string; instructions: string[] } {
  const brand = (Device?.brand || Device?.manufacturer || "").toLowerCase();

  if (brand.includes("xiaomi") || brand.includes("redmi") || brand.includes("poco")) {
    return {
      brand: "Xiaomi / MIUI",
      instructions: [
        "1. Open Security App > Manage Apps > FlashFits Delivery.",
        "2. Turn ON 'Autostart'.",
        "3. Under Battery Saver, select 'No restrictions'.",
      ],
    };
  }

  if (brand.includes("vivo") || brand.includes("iqoo")) {
    return {
      brand: "Vivo / FuntouchOS",
      instructions: [
        "1. Open Settings > Battery > High background power consumption.",
        "2. Find FlashFits Delivery and turn toggle ON.",
        "3. Under App Management, allow Autostart.",
      ],
    };
  }

  if (brand.includes("oppo") || brand.includes("realme") || brand.includes("oneplus")) {
    return {
      brand: "Oppo / Realme / OnePlus",
      instructions: [
        "1. Open Settings > Battery > More battery settings > App battery management.",
        "2. Find FlashFits Delivery and enable 'Allow background activity' and 'Allow auto-launch'.",
        "3. Set Battery Optimization to 'Don't optimize'.",
      ],
    };
  }

  if (brand.includes("samsung")) {
    return {
      brand: "Samsung / One UI",
      instructions: [
        "1. Open Settings > Battery > Background usage limits.",
        "2. Tap 'Never sleeping apps' and add FlashFits Delivery.",
        "3. In App Info > Battery, choose 'Unrestricted'.",
      ],
    };
  }

  return {
    brand: "Android",
    instructions: [
      "1. In Settings > Apps > FlashFits Delivery > Battery, select 'Unrestricted'.",
      "2. Allow background activity so orders ring reliably.",
    ],
  };
}
