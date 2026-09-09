import { useState, useEffect, useRef } from 'react';
import type * as ExpoNotifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import api from '../config/axiosConfig'; 
import * as SecureStore from 'expo-secure-store';

let Notifications: typeof ExpoNotifications | null = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications native module not available');
}

// Safe import of expo-device — native module may not be available in Expo Go
let Device: { isDevice: boolean } = { isDevice: Platform.OS !== 'web' };
try {
  Device = require('expo-device');
} catch (e) {
  console.warn('expo-device native module not available, using fallback');
}


// Wrap in try-catch to prevent crash in Expo Go (SDK 53+ removed remote notification support)
try {
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const isSilent = notification.request.content.data?.silent === true;
        return {
          shouldShowAlert: true,
          shouldPlaySound: !isSilent,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }
} catch (e) {
  console.warn('Push notifications not supported in this environment:', e);
}

/**
 * Handle notification tap — navigate to the correct screen based on notification data.
 */
function handleNotificationNavigation(data: any) {
  if (!data) return;

  const { type } = data;

  if (type === 'new_order_request') {
    // Navigate to orderFlow — the accept screen (step 0)
    router.push({ pathname: '/(orderFlow)', params: { step: 0 } });
  }
  // Add more notification types here as needed
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<ExpoNotifications.Notification | undefined>();
  const notificationListener = useRef<ExpoNotifications.Subscription | null>(null);
  const responseListener = useRef<ExpoNotifications.Subscription | null>(null);

  async function registerForPushNotificationsAsync() {
    let token;

    try {
      if (Notifications && Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('order_alerts', {
          name: 'Order Alerts (Loud & Urgent)',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500, 250, 1000],
          lightColor: '#FF231F7C',
          sound: 'default',
          bypassDnd: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          },
        });
      }

      if (Notifications && Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          console.warn("Project ID not found for push notifications.");
        }
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        console.log("Expo Push Token:", token);
      } else {
        console.log('Must use physical device for Push Notifications');
      }
    } catch (e) {
      console.warn("Push notification registration failed (expected in Expo Go):", e);
    }

    return token;
  }

  const sendPushTokenToBackend = async (token: string) => {
    try {
      await api.put('/deliveryRider/push-token', { token });
      console.log("Push token sent to backend successfully.");
    } catch (error) {
      console.error("Failed to send push token to backend:", error);
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        try {
          const authToken = await SecureStore.getItemAsync("token");
          if (authToken) {
            await sendPushTokenToBackend(token);
          }
        } catch (authErr) {
          console.log("Token push sync check error:", authErr);
        }
      }
    }).catch(e => {
      console.warn("Push notification setup failed:", e);
    });

    try {
      if (Notifications) {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: ExpoNotifications.Notification) => {
          setNotification(notification);
        });

        // Handle notification tap — navigate to correct screen
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: ExpoNotifications.NotificationResponse) => {
          console.log("📱 Notification tapped:", response);
          const data = response.notification.request.content.data;
          handleNotificationNavigation(data);
        });

        // Handle cold start — app was killed, user tapped notification to open it
        Notifications.getLastNotificationResponseAsync().then((response) => {
          if (response) {
            console.log("📱 App opened from killed state via notification:", response);
            const data = response.notification.request.content.data;
            // Small delay to let the app router initialize
            setTimeout(() => handleNotificationNavigation(data), 500);
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to add notification listeners (expected in Expo Go):", e);
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification, sendPushTokenToBackend };
}

