import { Alert } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Colors } from "@common-ui/constants/colors";
import { isAndroid, isWeb } from "@common-ui/utils/responsive";
import { openAppSettings } from "@utils/navigation";

// This is for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function isPushNotificationsEnabledAsync() {
  const permissions = await Notifications.getPermissionsAsync();
  return (permissions as any).granted ?? false;
}

export async function registerForPushNotificationsAsync(
  requestPermissions: boolean,
  t
): Promise<string> {
  let token: string;

  // We're not interested in PN's on web
  if (isWeb) {
    return "";
  }

  if (isAndroid) {
    await Notifications.setNotificationChannelAsync("default", {
      name: "All Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: Colors.primary,
    });
  }

  if (Device.isDevice) {
    const existingPermissions = await Notifications.getPermissionsAsync();
    let isGranted: boolean = (existingPermissions as any).granted ?? false;

    if (requestPermissions && !isGranted) {
      const permResponse = await Notifications.requestPermissionsAsync();
      isGranted = (permResponse as any).granted ?? false;
    }

    if (requestPermissions && !isGranted) {
      Alert.alert(t("alertsScreen.pnsDisabledTitle"), t("alertsScreen.pnsDisabledMessage"), [
        {
          text: t("alertsScreen.pnsDisabledButton"),
          onPress: () => openAppSettings(),
        },
      ]);

      return "";
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}
