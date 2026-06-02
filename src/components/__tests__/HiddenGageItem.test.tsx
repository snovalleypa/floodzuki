/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react-native";

import HiddenGageItem from "../HiddenGageItem";

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
        "statuses.Offline": "Offline",
        "regionSummary.noRecentData": "No recent data",
      };
      return map[key] ?? key;
    },
  }),
}));

describe("HiddenGageItem", () => {
  it("renders the location name, location id, Offline pill, and 'No recent data'", () => {
    const item = {
      locationId: "USGS-23",
      locationInfo: { locationName: "Tolt River — Above Carnation" },
    } as any;
    const { getByText } = render(<HiddenGageItem item={item} />);
    expect(getByText("Tolt River — Above Carnation")).toBeTruthy();
    expect(getByText("USGS-23")).toBeTruthy();
    expect(getByText("Offline")).toBeTruthy();
    expect(getByText("No recent data")).toBeTruthy();
  });
});
