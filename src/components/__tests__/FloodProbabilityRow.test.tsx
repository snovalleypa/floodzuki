import React from "react";
import { render } from "@testing-library/react-native";

import FloodProbabilityRow from "../FloodProbabilityRow";

const mockUseFloodProbability = jest.fn();
const mockIsUnavailable = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
}));
jest.mock("app/_layout", () => ({ ROUTES: { GageDetails: "/gage/[id]" } }));
jest.mock("mobx-react-lite", () => ({ observer: (fn: any) => fn }));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));
jest.mock("@utils/useFloodProbability", () => ({
  useFloodProbability: (...args: any[]) => mockUseFloodProbability(...args),
  isFloodForecastUnavailable: (...args: any[]) => mockIsUnavailable(...args),
}));
jest.mock("@components/FloodRiskBadge", () => ({ __esModule: true, default: () => null }));

const RED = 60;
const gage: any = { locationId: "USGS-38", redStage: RED, lastReading: { waterHeight: 50 } };

function renderRow() {
  return render(<FloodProbabilityRow gage={gage} threshold={RED} primary="Falls" />);
}

beforeEach(() => {
  mockUseFloodProbability.mockReset().mockReturnValue(null);
  mockIsUnavailable.mockReset().mockReturnValue(false);
});

describe("FloodProbabilityRow value cell", () => {
  it("shows a spinner while the forecast is loading", () => {
    const { UNSAFE_queryByType, queryByText } = renderRow();
    const { ActivityIndicator } = jest.requireActual("react-native");
    expect(UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
    expect(queryByText("forecastScreen.floodChanceUnavailable")).toBeNull();
  });

  it("shows unavailable instead of a spinner when the forecast inputs failed", () => {
    mockIsUnavailable.mockReturnValue(true);
    const { UNSAFE_queryByType, getByText } = renderRow();
    const { ActivityIndicator } = jest.requireActual("react-native");
    expect(getByText("forecastScreen.floodChanceUnavailable")).toBeTruthy();
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it("prefers a resolved chance (e.g. the observed path) over unavailable", () => {
    mockIsUnavailable.mockReturnValue(true);
    mockUseFloodProbability.mockReturnValue({
      windowDays: 5,
      chance: { level: "percent", percent: 40 },
    });
    const { getByText, queryByText } = renderRow();
    expect(getByText("40%")).toBeTruthy();
    expect(queryByText("forecastScreen.floodChanceUnavailable")).toBeNull();
  });

  it("shows flooding now when already over the threshold", () => {
    mockIsUnavailable.mockReturnValue(true);
    const { getByText } = render(
      <FloodProbabilityRow
        gage={{ ...gage, lastReading: { waterHeight: 61 } }}
        threshold={RED}
        primary="Falls"
      />
    );
    expect(getByText("forecastScreen.floodingNow")).toBeTruthy();
  });
});
