/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react-native";

import HiddenGageItem from "../HiddenGageItem";

jest.mock("mobx-react-lite", () => ({
  observer: (fn: any) => fn,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("app/_layout", () => ({
  ROUTES: {
    GageDetails: "/gage/[id]",
  },
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "regionSummary.offlineGauge": "OFFLINE",
        "regionSummary.noRecentData": "No recent data",
      };
      return map[key] ?? key;
    },
  }),
}));

const makeStub = (overrides: Record<string, unknown> = {}) =>
  ({
    locationId: "USGS-23",
    _isStub: true,
    isOffline: true,
    locationInfo: { locationName: "Tolt River — Above Carnation" },
    ...overrides,
  } as any);

describe("HiddenGageItem", () => {
  it("renders the location name, location id, OFFLINE pill, and 'No recent data'", () => {
    const { getByText } = render(<HiddenGageItem item={makeStub()} />);
    expect(getByText("Tolt River — Above Carnation")).toBeTruthy();
    expect(getByText("USGS-23")).toBeTruthy();
    expect(getByText("OFFLINE")).toBeTruthy();
    expect(getByText("No recent data")).toBeTruthy();
  });
});
