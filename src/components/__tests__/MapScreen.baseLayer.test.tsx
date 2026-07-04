import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import MapScreen from "../../../app/(root)/map/index";
import { MapBaseLayerProvider } from "@common-ui/contexts/MapBaseLayerContext";
import { MapBaseLayer } from "@models/MapModels";
import GageMap from "@components/GageMap";
import { isSatelliteAvailable } from "@components/mapTilerStyle";

// GageMap as a jest.fn so we can read the props it was called with (baseLayer).
jest.mock("@components/GageMap", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

// Toggle stub that exposes baseLayer + a press hook via a Pressable.
jest.mock("@components/MapBaseLayerToggle", () => {
  const ReactLocal = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ baseLayer, onPress }: any) =>
      ReactLocal.createElement(
        Pressable,
        { testID: "toggle", onPress },
        ReactLocal.createElement(Text, { testID: "toggle-state" }, baseLayer)
      ),
  };
});

jest.mock("@components/mapTilerStyle", () => ({
  isSatelliteAvailable: jest.fn(() => true),
}));

jest.mock("@components/InundationControl", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/useInundationLevels", () => ({
  useInundationLevels: () => ({ levels: [], ready: true }),
}));

jest.mock("@common-ui/components/PageTitle", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/ErrorDetails", () => ({
  ErrorDetails: () => null,
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));

jest.mock("mobx-react-lite", () => ({ observer: (fn: any) => fn }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    regionStore: { region: { id: 1 } },
    getLocationsWithGages: () => [],
  }),
}));

const MockGageMap = GageMap as unknown as jest.Mock;
const mockIsSatelliteAvailable = isSatelliteAvailable as jest.Mock;

const renderScreen = () =>
  render(
    <MapBaseLayerProvider>
      <MapScreen />
    </MapBaseLayerProvider>
  );

describe("MapScreen base layer toggle", () => {
  beforeEach(() => {
    MockGageMap.mockClear();
    mockIsSatelliteAvailable.mockReturnValue(true);
  });

  it("passes the default Map base layer to GageMap and renders the toggle", () => {
    const { getByTestId } = renderScreen();
    expect(MockGageMap.mock.calls[0][0].baseLayer).toBe(MapBaseLayer.Map);
    expect(getByTestId("toggle")).toBeTruthy();
  });

  it("switches GageMap to Satellite when the toggle is pressed", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("toggle"));
    const lastCall = MockGageMap.mock.calls[MockGageMap.mock.calls.length - 1];
    expect(lastCall[0].baseLayer).toBe(MapBaseLayer.Satellite);
  });

  it("hides the toggle when satellite is unavailable", () => {
    mockIsSatelliteAvailable.mockReturnValue(false);
    const { queryByTestId } = renderScreen();
    expect(queryByTestId("toggle")).toBeNull();
  });
});
