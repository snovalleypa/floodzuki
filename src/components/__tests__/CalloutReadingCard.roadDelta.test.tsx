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
const RED = 60;

// Road status mirrors the model: |level − road|, below/over.
const makeRoadStatus = () =>
  jest.fn((level: number) => ({
    name: "NE Test Road",
    level: level - ROAD,
    preposition: ROAD - level > 0 ? "statusLevelsCard.below" : "statusLevelsCard.over",
    delta: Math.abs(level - ROAD),
  }));

// Flood status mirrors the model: |level − redStage|, below/above.
const makeFloodStatus = () =>
  jest.fn((level: number) => ({
    level: level - RED,
    preposition: RED - level > 0 ? "statusLevelsCard.below" : "statusLevelsCard.above",
    delta: Math.abs(level - RED),
  }));

function buildGage({
  hasRoad = true,
  hasReading = true,
  predictions = [],
}: { hasRoad?: boolean; hasReading?: boolean; predictions?: any[] } = {}) {
  const getCalculatedRoadStatus = makeRoadStatus();
  const getCalculatedFloodStatus = makeFloodStatus();

  const gage: any = {
    waterLevel: 52, // live level
    roadSaddleHeight: hasRoad ? ROAD : undefined,
    roadDisplayName: hasRoad ? "NE Test Road" : undefined,
    redStage: RED,
    predictions,
    status: {
      lastReading: hasReading
        ? { waterHeight: 52, waterDischarge: 1000, timestamp: "2026-06-12T08:00:00" }
        : undefined,
      floodLevel: hasReading ? "Normal" : "Offline",
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
    getCalculatedFloodStatus,
  };
  return { gage, getCalculatedRoadStatus, getCalculatedFloodStatus };
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

  it("stays in live mode for the to='now' / from='-N' live shortcut", () => {
    const { gage, getCalculatedRoadStatus } = buildGage();
    // The "live" shortcut (and the back-to-live button from a historic view)
    // sets from="-N" and to="now" — this must be treated as live, not peak.
    mockUseLocalSearchParams.mockReturnValue({ from: "-2", to: "now" });

    render(<CalloutReadingCard gage={gage} />);

    // Live → uses the live reading (52), not the peak (64).
    expect(getCalculatedRoadStatus).toHaveBeenCalledWith(52);
    expect(getCalculatedRoadStatus).not.toHaveBeenCalledWith(64);
  });
});

describe("CalloutReadingCard — Flood Level row (no road)", () => {
  it("renders a Flood Level row instead of the Road row when the gauge has no road", () => {
    const { gage } = buildGage({ hasRoad: false });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText("calloutReading.floodLevel")).not.toBeNull();
    expect(queryByText("calloutReading.road")).toBeNull();
  });

  it("computes the flood delta from the reading shown (peak for historic)", () => {
    const { gage, getCalculatedFloodStatus } = buildGage({ hasRoad: false });
    mockUseLocalSearchParams.mockReturnValue({ from: "2022-02-28", to: "2022-03-01" });

    render(<CalloutReadingCard gage={gage} />);

    // Peak height (64) → 4.0 ft above the red stage (60).
    expect(getCalculatedFloodStatus).toHaveBeenCalledWith(64);
  });

  it("hides both the Road and Flood Level rows when there is no reading (offline gauge with a road)", () => {
    const { gage } = buildGage({ hasRoad: true, hasReading: false });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText("calloutReading.road")).toBeNull();
    expect(queryByText("calloutReading.floodLevel")).toBeNull();
  });

  it("hides the Flood Level row when there is no reading (offline gauge without a road)", () => {
    const { gage } = buildGage({ hasRoad: false, hasReading: false });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText("calloutReading.floodLevel")).toBeNull();
    expect(queryByText("calloutReading.road")).toBeNull();
  });

  it("keeps the Road row (no Flood Level row) when the gauge has a road", () => {
    const { gage } = buildGage({ hasRoad: true });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText("calloutReading.road")).not.toBeNull();
    expect(queryByText("calloutReading.floodLevel")).toBeNull();
  });
});

// Predictions rising 1 ft per hour from `start`.
function risingPredictions(start: number) {
  return Array.from({ length: 8 }, (_, i) => ({
    timestamp: `2026-06-12T${String(i).padStart(2, "0")}:00:00`,
    waterHeight: start + i,
  }));
}

describe("CalloutReadingCard — trend/road crossing line", () => {
  it("shows the road-saddle crossing under the Trend row when the trend reaches it", () => {
    // Road is 58; rising 56,57,58... crosses it.
    const { gage } = buildGage({ hasRoad: true, predictions: risingPredictions(56) });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText(/trendIntersectsRoad/)).not.toBeNull();
    expect(queryByText(/trendIntersectsFlood/)).toBeNull();
  });

  it("shows the flood-level crossing for a gauge without a road", () => {
    // Red stage is 60; rising 58,59,60... crosses it.
    const { gage } = buildGage({ hasRoad: false, predictions: risingPredictions(58) });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText(/trendIntersectsFlood/)).not.toBeNull();
    expect(queryByText(/trendIntersectsRoad/)).toBeNull();
  });

  it("shows no crossing line when there are no predictions", () => {
    const { gage } = buildGage({ hasRoad: true, predictions: [] });
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByText } = render(<CalloutReadingCard gage={gage} />);

    expect(queryByText(/trendIntersects/)).toBeNull();
  });
});
