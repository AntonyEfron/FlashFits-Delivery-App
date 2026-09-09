import { Vibration } from 'react-native';
import { Audio } from 'expo-av';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {}

let alertSound = null;
let isAlerting = false;
let autoStopTimer = null;
let localAlertNotificationId = null;

// Max alert duration before auto-stop (60 seconds)
const MAX_ALERT_DURATION_MS = 60 * 1000;

// We use a looping vibration pattern: [wait, vibrate, wait, vibrate...]
// 1000ms wait, 2000ms vibrate
const VIBRATION_PATTERN = [0, 2000, 1000];

export const playOrderAlert = async () => {
  if (isAlerting) return;
  isAlerting = true;

  try {
    // Start aggressive looping vibration
    Vibration.vibrate(VIBRATION_PATTERN, true);

    // Trigger local notification on order_alerts channel (bypasses DND / silent via ALARM stream)
    if (Notifications) {
      try {
        localAlertNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "🚨 NEW DELIVERY REQUEST!",
            body: "New order available. Accept within 2 minutes!",
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 500, 250, 500, 250, 1000],
            data: { type: 'new_order_request' },
            channelId: 'order_alerts',
          },
          trigger: null,
        });
      } catch (notifErr) {
        console.log("Local order alert notification error:", notifErr);
      }
    }

    // Play alert sound
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
      { shouldPlay: true, isLooping: true }
    );
    alertSound = sound;
  } catch (error) {
    console.error("Error playing order alert sound:", error);
  }

  // Auto-stop after MAX_ALERT_DURATION_MS to prevent infinite alerting
  autoStopTimer = setTimeout(() => {
    console.log("⏰ Alert auto-stopped after max duration");
    stopOrderAlert();
  }, MAX_ALERT_DURATION_MS);
};

export const stopOrderAlert = async () => {
  // Clear auto-stop timer
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }

  // Always attempt to cancel vibration and sound, even if isAlerting is false.
  // This handles the case where the JS bundle reloaded (cold start) and
  // isAlerting was reset, but the OS-level vibration/sound is still running.
  isAlerting = false;

  try {
    Vibration.cancel();
  } catch (e) {
    // Vibration.cancel() is safe to call even when not vibrating
  }

  try {
    if (alertSound) {
      await alertSound.stopAsync();
      await alertSound.unloadAsync();
      alertSound = null;
    }
  } catch (error) {
    console.error("Error stopping order alert:", error);
    alertSound = null;
  }

  if (Notifications && localAlertNotificationId) {
    try {
      await Notifications.dismissNotificationAsync(localAlertNotificationId);
      localAlertNotificationId = null;
    } catch (e) {}
  }
};

/**
 * Nuclear stop — cancels everything unconditionally.
 * Use from AppState listener when app comes to foreground.
 */
export const forceStopAlert = () => {
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
  isAlerting = false;
  try { Vibration.cancel(); } catch (e) {}
  if (alertSound) {
    alertSound.stopAsync().then(() => alertSound?.unloadAsync()).catch(() => {});
    alertSound = null;
  }
  if (Notifications && localAlertNotificationId) {
    try {
      Notifications.dismissNotificationAsync(localAlertNotificationId);
      localAlertNotificationId = null;
    } catch (e) {}
  }
};

