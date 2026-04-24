import * as Notifications from "expo-notifications";
import { isPushNotificationsEnabledAsync } from "../pushNotifications";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));

describe("isPushNotificationsEnabledAsync", () => {
  it("returns true when permissions are granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });

    const result = await isPushNotificationsEnabledAsync();

    expect(result).toBe(true);
  });

  it("returns false when permissions are denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });

    const result = await isPushNotificationsEnabledAsync();

    expect(result).toBe(false);
  });
});
