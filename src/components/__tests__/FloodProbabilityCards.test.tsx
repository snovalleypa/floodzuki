import React from "react";
import { render } from "@testing-library/react-native";

import FloodProbabilityCards from "../FloodProbabilityCards";

const mockIsUnavailable = jest.fn();
const mockMembership = jest.fn();

jest.mock("mobx-react-lite", () => ({ observer: (fn: any) => fn }));
jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({ getAllLocationsWithGages: () => [] }),
}));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));
jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isWideScreen: false }),
}));
jest.mock("@utils/floodCardMembership", () => ({
  selectCardMembership: () => mockMembership(),
}));
jest.mock("@utils/useFloodProbability", () => ({
  useFloodProbability: () => null,
  isFloodForecastUnavailable: (...args: any[]) => mockIsUnavailable(...args),
}));
// Rows are covered by their own test; here they only need to render their label.
jest.mock("@components/FloodProbabilityRow", () => {
  const { Text } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ primary }: any) => <Text>{primary}</Text> };
});

const NOTE = "forecastScreen.floodChanceUnavailableNote";

const road: any = {
  locationId: "SVPA-25",
  redStage: 66.5,
  roadSaddleHeight: 68,
  roadDisplayName: "Tolt Hill Rd.",
  locationInfo: { locationName: "Tolt Hill" },
};
const falls: any = {
  locationId: "USGS-38",
  redStage: 44.6,
  locationInfo: { locationName: "Falls" },
};

beforeEach(() => {
  mockIsUnavailable.mockReset().mockReturnValue(false);
  mockMembership.mockReset().mockReturnValue({ roadRows: [road], floodRows: [falls] });
});

describe("FloodProbabilityCards unavailable footer", () => {
  it("shows no footer when every row has a forecast", () => {
    const { queryByText } = render(<FloodProbabilityCards />);
    expect(queryByText(NOTE)).toBeNull();
  });

  it("checks each row under the threshold it requests (road saddle vs. red stage)", () => {
    render(<FloodProbabilityCards />);
    expect(mockIsUnavailable).toHaveBeenCalledWith(road, 68);
    expect(mockIsUnavailable).toHaveBeenCalledWith(falls);
  });

  it("shows one footer on the card whose row failed", () => {
    mockIsUnavailable.mockImplementation((gage: any) => gage === falls);
    const { queryAllByText } = render(<FloodProbabilityCards />);
    expect(queryAllByText(NOTE)).toHaveLength(1);
  });

  it("shows a footer on each card with a failed row", () => {
    mockIsUnavailable.mockReturnValue(true);
    const { queryAllByText } = render(<FloodProbabilityCards />);
    expect(queryAllByText(NOTE)).toHaveLength(2);
  });

  it("shows nothing for an empty card even when asked", () => {
    mockMembership.mockReturnValue({ roadRows: [], floodRows: [falls] });
    mockIsUnavailable.mockReturnValue(true);
    const { queryAllByText } = render(<FloodProbabilityCards />);
    expect(queryAllByText(NOTE)).toHaveLength(1);
  });
});
