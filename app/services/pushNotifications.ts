import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Colors } from '@common-ui/constants/colors';
import { useRouter } from 'expo-router';
import { isAndroid, isWeb } from '@common-ui/utils/responsive';
import { Timing } from '@common-ui/constants/timing';

// This is for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function isPushNotificationsEnabledAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  return existingStatus === 'granted';
}

export async function registerForPushNotificationsAsync(requestPermissions: boolean): Promise<string> {
  let token: string;

  // We're not interested in PN's on web
  if (isWeb) {
    return "";
  }

  if (isAndroid) {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: Colors.primary,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    

    if (requestPermissions && existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (requestPermissions && finalStatus !== 'granted') {
      Alert.alert('Push Notifications not enabled!', 'Please enable push notifications in your settings');
      return "";
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function useRegisterPushNotificationsListener(requestPermissions: boolean) {
  const router = useRouter();

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    registerForPushNotificationsAsync(requestPermissions);
  }, [])

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification?.request?.content?.data?.path &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const path = lastNotificationResponse.notification?.request?.content?.data?.path;

      if (path) {
        router.push(path);
      }
    }
  }, [lastNotificationResponse])
}