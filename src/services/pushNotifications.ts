import { Colors } from "@common-ui/constants/colors";
import { isAndroid, isWeb } from "@common-ui/utils/responsive";
import { openAppSettings } from "@utils/navigation";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

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

type NotificationPermissionsLike =
  | Notifications.NotificationPermissionsStatus
  | {
      granted?: boolean;
      status?: Notifications.PermissionStatus;
      ios?: Notifications.NotificationPermissionsStatus["ios"];
    };

function hasGrantedNotificationPermissions(permissions: NotificationPermissionsLike) {
  if ("granted" in permissions && permissions.granted) {
    return true;
  }

  if ("status" in permissions && permissions.status != null) {
    return permissions.status === Notifications.PermissionStatus.GRANTED;
  }

  const iosStatus = permissions.ios?.status;
  if (iosStatus == null) {
    return false;
  }

  return iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED;
}

export async function isPushNotificationsEnabledAsync() {
  const permissions = await Notifications.getPermissionsAsync();
  return hasGrantedNotificationPermissions(permissions);
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
    let isGranted = hasGrantedNotificationPermissions(existingPermissions);

    if (requestPermissions && !isGranted) {
      const permResponse = await Notifications.requestPermissionsAsync();
      isGranted = hasGrantedNotificationPermissions(permResponse);
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
