import { useState, useEffect, useRef } from 'react';
import type * as ExpoNotifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../config/axiosConfig'; 

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
      await api.put('/deliveryRiders/push-token', { token });
      console.log("Push token sent to backend successfully.");
    } catch (error) {
      console.error("Failed to send push token to backend:", error);
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    }).catch(e => {
      console.warn("Push notification setup failed:", e);
    });

    try {
      if (Notifications) {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: ExpoNotifications.Notification) => {
          setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: ExpoNotifications.NotificationResponse) => {
          console.log(response);
        });
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

