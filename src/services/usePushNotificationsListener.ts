import { useLocale } from "@common-ui/contexts/LocaleContext";
import { isWeb } from "@common-ui/utils/responsive";
import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { registerForPushNotificationsAsync } from "./pushNotifications";

export function useRegisterPushNotificationsListener(requestPermissions: boolean) {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    registerForPushNotificationsAsync(requestPermissions, t);
    Notifications.setBadgeCountAsync(0);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isWeb) {
      return () => {};
    }

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url || notification.request.content.data?.path;
      if (typeof url === "string") {
        router.push(url as Href);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
