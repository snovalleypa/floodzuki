// src/components/__tests__/GageDetailsChart.live-button.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { GageDetailsChart } from "../GageDetailsChart";

// --- Mocks ---
const mockParamsBox: { current: { from?: string; to?: string; historicEventId?: string } } = {
  current: {},
};
const mockSetParams = jest.fn();

jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: () => null,
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParamsBox.current,
  useRouter: () => ({ setParams: mockSetParams }),
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: true,
    getTimezone: () => "America/Los_Angeles",
    gagesStore: { fetchDataForGage: jest.fn(), isFetching: false },
  }),
}));

jest.mock("@common-ui/contexts/DatePickerContext", () => ({
  useDatePicker: () => ({ isVisible: false, showPicker: jest.fn(), hidePicker: jest.fn() }),
}));

jest.mock("@services/highcharts/LocalHighchartsReact", () => () => null);
jest.mock("@services/highcharts/HighchartsReactNative", () => () => null);
jest.mock("../GageDetailsChartNative", () => ({ GageDetailsChartNative: () => null }));
jest.mock("@utils/useGageChartOptions", () => ({ __esModule: true, default: () => [{}, null] }));
jest.mock("@utils/useTimeout", () => ({ useTimeout: jest.fn(), useInterval: jest.fn() }));
jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));
jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isMobile: false }),
  isAndroid: false,
  isIOS: false,
  isMobile: false,
  MobileScreen: () => null,
  WideScreen: () => null,
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: any) => children,
}));
jest.mock("@react-native-picker/picker", () => {
  function PickerMock() {
    return null;
  }
  function PickerItem() {
    return null;
  }
  PickerMock.Item = PickerItem;
  return { Picker: PickerMock };
});
jest.mock("../DatePickerVariantSwitch", () => () => null);
jest.mock("@common-ui/components/Icon", () => () => null);
jest.mock("@common-ui/components/Card", () => {
  const React = require("react");
  const Pass = ({ children }: any) => React.createElement(React.Fragment, null, children ?? null);
  return { Card: Pass, CardHeader: Pass, CardFooter: Pass };
});
jest.mock("@common-ui/components/Common", () => {
  const React = require("react");
  const Pass = ({ children }: any) => React.createElement(React.Fragment, null, children ?? null);
  return { Row: Pass, Cell: Pass, RowOrCell: Pass };
});
jest.mock("@common-ui/components/Conditional", () => {
  const React = require("react");
  return {
    If: ({ condition, children }: any) =>
      condition ? React.createElement(React.Fragment, null, children) : null,
    Ternary: ({ condition, children }: any) => {
      const arr = React.Children.toArray(children);
      return condition ? arr[0] ?? null : arr[1] ?? null;
    },
  };
});
jest.mock("@common-ui/components/Button", () => ({
  IconButton: () => null,
  SolidButton: () => null,
}));
jest.mock("@common-ui/components/Text", () => {
  const React = require("react");
  const RN = require("react-native");
  const Pass = ({ children }: any) =>
    React.createElement(RN.Text, null, typeof children === "string" ? children : null);
  return {
    MediumText: () => null,
    RegularText: () => null,
    SmallerText: () => null,
    LabelText: () => null,
    SmallTitle: Pass,
    MediumTitle: Pass,
  };
});
jest.mock("@utils/navigation", () => ({
  normalizeSearchParams: (v: string | string[]) => (Array.isArray(v) ? v.join(", ") : v),
}));
jest.mock("@utils/useTimeFormat", () => ({ formatReadingTime: (ts: string) => ts }));
jest.mock("@config/config", () => ({
  default: { LIVE_CHART_DATA_REFRESH_INTERVAL: 60000, GAGES_WITHOUT_DISHCARGE: [] },
}));

const mockGage: any = {
  locationId: "USGS-NF10",
  locationInfo: {
    floodEvents: [],
    hasDischarge: false,
    locationName: "North Fork Snoqualmie River",
    dischargeMin: 0,
    dischargeMax: 0,
    yMin: 0,
    yMax: 20,
  },
  readings: [],
  actualReadings: [],
  predictions: [],
  predictedFeetPerHour: 0,
  predictedCfsPerHour: 0,
  dataPoints: [],
  actualPoints: [],
  predictedPoints: [],
  noaaForecastData: [],
  hasData: false,
};

describe("GageDetailsChart — Live button", () => {
  beforeEach(() => {
    mockParamsBox.current = {};
    mockSetParams.mockClear();
  });

  it("does not render the Live button in live mode (to=now)", () => {
    mockParamsBox.current = { from: "-2", to: "now" };
    const { queryByText } = render(<GageDetailsChart gage={mockGage} />);
    expect(queryByText("forecastChart.live")).toBeNull();
  });

  it("does not render the Live button on cold-load (no params → live default)", () => {
    mockParamsBox.current = {};
    const { queryByText } = render(<GageDetailsChart gage={mockGage} />);
    expect(queryByText("forecastChart.live")).toBeNull();
  });

  it("renders the Live button when range is historic", () => {
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
    const { getByText } = render(<GageDetailsChart gage={mockGage} />);
    expect(getByText("forecastChart.live")).toBeTruthy();
  });

  it("pressing Live resets URL to from=-2 / to=now and clears historicEventId", () => {
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" };
    const { getByText } = render(<GageDetailsChart gage={mockGage} />);

    fireEvent.press(getByText("forecastChart.live"));

    expect(mockSetParams).toHaveBeenCalledWith({
      historicEventId: undefined,
      from: "-2",
      to: "now",
    });
  });
});
