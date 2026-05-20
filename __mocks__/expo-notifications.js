/* eslint-disable no-undef */
// Mocked in tests because expo-notifications calls addPushTokenListener at
// module-load time, which logs an Expo Go SDK 53 warning under Jest. Safe to
// stub: the app uses a dev-client build (not Expo Go) at runtime, and no test
// exercises real push-notification behavior — pushNotifications.ts is only
// imported transitively via AuthSession/RootStore.
module.exports = {
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "" }),
  addPushTokenListener: jest.fn(),
  removePushTokenSubscription: jest.fn(),
  AndroidImportance: {
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
};
