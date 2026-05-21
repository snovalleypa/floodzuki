/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import RegionSummaryCard from "../RegionSummaryCard";

jest.mock("mobx-react-lite", () => ({
  observer: (fn: any) => fn,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("app/_layout", () => ({
  ROUTES: { Forecast: "/forecast" },
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        "regionSummary.allNormal": "All gauges normal",
        "regionSummary.flooding": `${opts?.count} flooding`,
        "regionSummary.nearFlooding": `${opts?.count} near flooding`,
        "regionSummary.noFloodingPredicted": "No flooding predicted",
        "regionSummary.nearFloodPredicted": "Near-flood predicted",
        "regionSummary.floodingPredicted": "Flooding predicted",
        "regionSummary.active": "active",
        "regionSummary.offline": "offline",
        "regionSummary.hidden": "hidden",
        "regionSummary.showHidden": "Show hidden",
      };
      return map[key] ?? key;
    },
  }),
}));

let mockStores: any = {};
jest.mock("@models/helpers/useStores", () => ({
  useStores: () => mockStores,
}));

jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isMobile: false }),
  isWeb: true,
}));

const setup = (overrides: Partial<typeof mockStores> = {}) => {
  mockStores = {
    showHiddenOffline: false,
    setShowHiddenOffline: jest.fn(),
    getBucketCounts: () => ({
      active: 9,
      visibleOffline: 0,
      hidden: 12,
      flooding: 0,
      nearFlooding: 0,
    }),
    forecastsStore: { severity: "none" },
    ...overrides,
  };
};

describe("RegionSummaryCard", () => {
  it("renders calm-state copy when nothing is flooding", () => {
    setup();
    const { getByText } = render(<RegionSummaryCard />);
    expect(getByText("All gauges normal")).toBeTruthy();
    expect(getByText("No flooding predicted")).toBeTruthy();
  });

  it("renders flood + near-flood status when both are present", () => {
    setup({
      getBucketCounts: () => ({
        active: 5,
        visibleOffline: 0,
        hidden: 12,
        flooding: 3,
        nearFlooding: 2,
      }),
      forecastsStore: { severity: "flood" },
    });
    const { getByText } = render(<RegionSummaryCard />);
    expect(getByText(/3 flooding/)).toBeTruthy();
    expect(getByText(/2 near flooding/)).toBeTruthy();
    expect(getByText("Flooding predicted")).toBeTruthy();
  });

  it("disables the toggle when hidden count is zero", () => {
    setup({
      getBucketCounts: () => ({
        active: 9,
        visibleOffline: 0,
        hidden: 0,
        flooding: 0,
        nearFlooding: 0,
      }),
    });
    const { getByTestId } = render(<RegionSummaryCard />);
    expect(getByTestId("region-summary-toggle").props.disabled).toBe(true);
  });

  it("calls setShowHiddenOffline when the toggle is flipped", () => {
    setup();
    const { getByTestId } = render(<RegionSummaryCard />);
    fireEvent(getByTestId("region-summary-toggle"), "valueChange", true);
    expect(mockStores.setShowHiddenOffline).toHaveBeenCalledWith(true);
  });

  it("rolls hidden gauges into the offline count (hidden gauges are also offline)", () => {
    setup({
      getBucketCounts: () => ({
        active: 9,
        visibleOffline: 2,
        hidden: 3,
        flooding: 0,
        nearFlooding: 0,
      }),
    });
    const { getByText } = render(<RegionSummaryCard />);
    expect(getByText("9")).toBeTruthy(); // active
    expect(getByText("3")).toBeTruthy(); // hidden
    // 2 visibleOffline + 3 hidden = 5 offline
    expect(getByText("5")).toBeTruthy();
  });
});
