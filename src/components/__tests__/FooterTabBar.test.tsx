import React from "react";
import { Text } from "react-native";
import { Stack, Tabs, router } from "expo-router";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";

import { TabBar } from "../../../app/(root)/_layout";

// Real expo-router navigation (renderRouter) with stub screens, so the test
// exercises the actual stack/tab behavior our footer drives — not mocks of it.

jest.mock("app/_layout", () => ({
  ROUTES: { Gages: "/gage", Forecast: "/forecast" },
  routes: {
    "/gage": { path: "/gage", icon: "activity", tabName: "gage", title: "Gauges" },
    "/forecast": { path: "/forecast", icon: "trending-up", tabName: "forecast", title: "Forecast" },
  },
}));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
jest.mock("@common-ui/contexts/AssetsContext", () => ({
  useAppAssets: () => ({ getAsset: () => null }),
}));
jest.mock("@common-ui/components/Icon", () => ({ __esModule: true, default: () => null }));
jest.mock("expo-image", () => ({ __esModule: true, Image: () => null }));
jest.mock("@expo/match-media", () => ({}));
jest.mock("@services/expoUpdates", () => ({ useCheckForUpdates: jest.fn() }));
jest.mock("@services/usePushNotificationsListener", () => ({
  useRegisterPushNotificationsListener: jest.fn(),
}));
jest.mock("@components/LocaleChange", () => () => null);
jest.mock("@components/TasteOfTheValleyBanner", () => () => null);
jest.mock("@components/AppStoreBanner", () => () => null);

const RootTabs = () => (
  <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="gage" />
    <Tabs.Screen name="forecast" />
  </Tabs>
);
const StackLayout = () => <Stack screenOptions={{ headerShown: false }} />;

function renderApp() {
  return renderRouter(
    {
      _layout: RootTabs,
      "gage/_layout": StackLayout,
      "gage/index": () => <Text>Gauge list</Text>,
      "gage/[id]": () => <Text>Gauge details</Text>,
      "forecast/_layout": StackLayout,
      "forecast/index": () => <Text>Forecast list</Text>,
    },
    { initialUrl: "/gage" }
  );
}

// renderRouter turns on fake timers; the native stack resets on tabPress inside
// requestAnimationFrame, so flush timers after the press.
function pressTab(label: string) {
  act(() => {
    fireEvent.press(screen.getByText(label));
    jest.runOnlyPendingTimers();
  });
}

// Route names currently in the Gauges tab's stack, bottom to top.
function gageStackRoutes(app: ReturnType<typeof renderApp>): string[] {
  const findGageTab = (state: any): any => {
    for (const route of state?.routes ?? []) {
      if (route.name === "gage") {
        return route;
      }
      const nested = findGageTab(route.state);
      if (nested) {
        return nested;
      }
    }
    return null;
  };
  const gageTab = findGageTab(app.getRouterState());
  return (gageTab?.state?.routes ?? []).map((r: any) => r.name);
}

describe("footer TabBar", () => {
  it("tapping Gauges from a details screen returns to the list instead of stacking a new one", () => {
    const app = renderApp();
    act(() => router.push("/gage/USGS-38"));
    expect(app.getPathname()).toBe("/gage/USGS-38");

    pressTab("Gauges");

    expect(app.getPathname()).toBe("/gage");
    expect(gageStackRoutes(app)).toEqual(["index"]);
    expect(screen.queryByText("Gauge details")).toBeNull();
  });

  it("switching to another tab and back keeps your place in the Gauges tab", () => {
    const app = renderApp();
    act(() => router.push("/gage/USGS-38"));

    pressTab("Forecast");
    expect(app.getPathname()).toBe("/forecast");

    pressTab("Gauges");
    expect(app.getPathname()).toBe("/gage/USGS-38");
    expect(gageStackRoutes(app)).toEqual(["index", "[id]"]);
  });

  it("tapping the focused tab on its first screen does nothing", () => {
    const app = renderApp();

    pressTab("Gauges");

    expect(app.getPathname()).toBe("/gage");
    expect(gageStackRoutes(app)).toEqual(["index"]);
  });
});
