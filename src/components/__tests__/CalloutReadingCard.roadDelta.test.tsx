import React from "react";
import { render } from "@testing-library/react-native";

import CalloutReadingCard from "../CalloutReadingCard";

const mockUseLocalSearchParams = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));
jest.mock("mobx-react-lite", () => ({ observer: (fn: any) => fn }));
jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    gagesStore: { isFetching: false },
    getTimezone: () => "America/Los_Angeles",
  }),
}));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));
jest.mock("@utils/useFloodProbability", () => ({ useFloodProbability: () => null }));
jest.mock("@components/TrendIcon", () => ({
  __esModule: true,
  default: () => null,
  TREND_ICON_TYPES: { Trend: "Trend" },
}));
jest.mock("@utils/utils", () => ({
  isNullish: (v: any) => v === null || v === undefined,
  useUtils: () => ({
    formatFlow: (v: any) => `${v} cfs`,
    formatHeight: (v: any) => `${v} ft`,
    formatTrend: (v: any) => `${v}`,
  }),
}));

const ROAD = 58;

function buildGage() {
  const getCalculatedRoadStatus = jest.fn((level: number) => ({
    name: "NE Test Road",
    level: level - ROAD,
    preposition: ROAD - level > 0 ? "statusLevelsCard.below" : "statusLevelsCard.over",
    delta: Math.abs(level - ROAD),
  }));

  const gage: any = {
    waterLevel: 52, // live level (below the road)
    roadSaddleHeight: ROAD,
    roadDisplayName: "NE Test Road",
    redStage: 60,
    status: {
      lastReading: { waterHeight: 52, waterDischarge: 1000, timestamp: "2026-06-12T08:00:00" },
      floodLevel: "Normal",
      levelTrend: "Steady",
      waterTrend: { trendValue: 0 },
    },
    peakStatus: {
      lastReading: { waterHeight: 64, waterDischarge: 9000, timestamp: "2022-03-01T12:00:00" },
      floodLevel: "Flooding",
      levelTrend: "Steady",
      waterTrend: { trendValue: 0.5 },
    },
    getCalculatedRoadStatus,
  };
  return { gage, getCalculatedRoadStatus };
}

describe("CalloutReadingCard — road delta source", () => {
  it("computes the road delta from the PEAK reading for a historic range", () => {
    const { gage, getCalculatedRoadStatus } = buildGage();
    mockUseLocalSearchParams.mockReturnValue({ from: "2022-02-28", to: "2022-03-01" });

    render(<CalloutReadingCard gage={gage} />);

    // Peak height (64), not the live level (52).
    expect(getCalculatedRoadStatus).toHaveBeenCalledWith(64);
    expect(getCalculatedRoadStatus).not.toHaveBeenCalledWith(52);
  });

  it("computes the road delta from the live reading when showing 'now'", () => {
    const { gage, getCalculatedRoadStatus } = buildGage();
    mockUseLocalSearchParams.mockReturnValue({});

    render(<CalloutReadingCard gage={gage} />);

    expect(getCalculatedRoadStatus).toHaveBeenCalledWith(52);
  });
});
