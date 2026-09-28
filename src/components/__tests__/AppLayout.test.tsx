import React from "react";
import { act, render } from "@testing-library/react-native";
import { observable, runInAction } from "mobx";

import { RootStoreProvider } from "@models/helpers/useStores";
import AppLayout from "../../../app/(root)/_layout";

// The layout's job under test is wiring: react to login/push state changes in the
// store. Everything visual is stubbed so the test only exercises that wiring.
jest.mock("expo-router", () => ({
  __esModule: true,
  Slot: () => null,
  Link: ({ children }: { children: React.ReactNode }) => children,
  Tabs: Object.assign(() => null, { Screen: () => null }),
  usePathname: () => "/",
}));
jest.mock("expo-image", () => ({ __esModule: true, Image: () => null }));
jest.mock("@expo/match-media", () => ({}));
jest.mock("app/_layout", () => ({ ROUTES: {}, routes: {} }));
jest.mock("@common-ui/utils/responsive", () => ({
  isWeb: false,
  useResponsive: () => ({ isMobile: true, isWideScreen: false }),
}));
jest.mock("@common-ui/contexts/AssetsContext", () => ({
  useAppAssets: () => ({ getAsset: () => null }),
}));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
jest.mock("@components/LocaleChange", () => () => null);
jest.mock("@components/TasteOfTheValleyBanner", () => () => null);
jest.mock("@components/AppStoreBanner", () => () => null);
jest.mock("@services/expoUpdates", () => ({ useCheckForUpdates: jest.fn() }));

const mockPushListener = jest.fn();
jest.mock("@services/usePushNotificationsListener", () => ({
  useRegisterPushNotificationsListener: (enabled: boolean) => mockPushListener(enabled),
}));

function makeStore(loggedIn: boolean) {
  const authSessionStore = observable({
    sessionState: loggedIn ? "loggedIn" : "notLoggedIn",
    isPushNotificationsEnabled: false,
    get isLoggedIn() {
      return this.sessionState === "loggedIn";
    },
    reauthenticate: jest.fn().mockResolvedValue(undefined),
  });
  return {
    authSessionStore,
    fetchMainData: jest.fn().mockResolvedValue(undefined),
  };
}

function renderLayout(store: ReturnType<typeof makeStore>) {
  return render(
    <RootStoreProvider value={store as never}>
      <AppLayout />
    </RootStoreProvider>
  );
}

beforeEach(() => {
  mockPushListener.mockClear();
});

describe("AppLayout reacts to store changes", () => {
  it("refetches main data when the user logs in after the app started", async () => {
    const store = makeStore(false);
    renderLayout(store);
    await act(async () => {});
    expect(store.fetchMainData).toHaveBeenCalledTimes(1);

    await act(async () => {
      runInAction(() => {
        store.authSessionStore.sessionState = "loggedIn";
      });
    });

    expect(store.fetchMainData).toHaveBeenCalledTimes(2);
  });

  it("refetches main data when the user logs out", async () => {
    const store = makeStore(true);
    renderLayout(store);
    await act(async () => {});
    expect(store.fetchMainData).toHaveBeenCalledTimes(1);

    await act(async () => {
      runInAction(() => {
        store.authSessionStore.sessionState = "notLoggedIn";
      });
    });

    expect(store.fetchMainData).toHaveBeenCalledTimes(2);
  });

  it("passes the current push-notification setting to the listener after it changes", async () => {
    const store = makeStore(true);
    renderLayout(store);
    await act(async () => {});
    expect(mockPushListener).toHaveBeenLastCalledWith(false);

    await act(async () => {
      runInAction(() => {
        store.authSessionStore.isPushNotificationsEnabled = true;
      });
    });

    expect(mockPushListener).toHaveBeenLastCalledWith(true);
  });
});
