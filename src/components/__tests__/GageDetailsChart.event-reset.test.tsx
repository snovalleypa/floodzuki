// src/components/__tests__/GageDetailsChart.event-reset.test.tsx
import React from "react";
import { render, act } from "@testing-library/react-native";
import { GageDetailsChart } from "../GageDetailsChart";

// --- Mocks ---
const mockParamsBox: {
  current: { from?: string; to?: string; historicEventId?: string };
} = { current: {} };
const mockSetParams = jest.fn();

let capturedPickerSelectedValue: any = undefined;

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
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: any) => children,
}));
jest.mock("@react-native-picker/picker", () => {
  function PickerMock(props: any) {
    capturedPickerSelectedValue = props.selectedValue;
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
jest.mock("@common-ui/components/Text", () => ({
  MediumText: () => null,
  RegularText: () => null,
  SmallerText: () => null,
  LabelText: () => null,
}));
jest.mock("@utils/navigation", () => ({
  normalizeSearchParams: (v: string | string[]) => (Array.isArray(v) ? v.join(", ") : v),
}));
jest.mock("@utils/useTimeFormat", () => ({ formatReadingTime: (ts: string) => ts }));
jest.mock("@config/config", () => ({
  default: { LIVE_CHART_DATA_REFRESH_INTERVAL: 60000, GAGES_WITHOUT_DISHCARGE: [] },
}));

const SELECT_EVENT = "gageDetailsChart._selectEvent";

const mockGage: any = {
  locationId: "USGS-NF10",
  locationInfo: {
    floodEvents: [
      { id: 5, eventName: "Feb 2020 Flood", fromDate: "2020-02-04", toDate: "2020-02-13" },
      { id: 6, eventName: "Jan 2022 Flood", fromDate: "2022-01-05", toDate: "2022-01-12" },
    ],
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

describe("GageDetailsChart — historic event picker resets when range changes", () => {
  beforeEach(() => {
    mockParamsBox.current = {};
    mockSetParams.mockClear();
    capturedPickerSelectedValue = undefined;
  });

  it("Picker reflects the historicEventId from the URL", () => {
    mockParamsBox.current = {
      from: "2020-02-04",
      to: "2020-02-13",
      historicEventId: "5",
    };
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedPickerSelectedValue).toBe("5");
  });

  it("Picker resets to SELECT_EVENT when URL clears historicEventId (range change)", async () => {
    mockParamsBox.current = {
      from: "2020-02-04",
      to: "2020-02-13",
      historicEventId: "5",
    };
    const { rerender } = render(<GageDetailsChart gage={mockGage} />);
    expect(capturedPickerSelectedValue).toBe("5");

    // Simulate a range change that clears historicEventId in the URL.
    // Pass a new floodEvents array reference so the HistoricEvents observer re-renders
    // (MobX observer bails out if props are referentially equal).
    mockParamsBox.current = { from: "-7", to: "now" };
    const updatedGage = {
      ...mockGage,
      locationInfo: {
        ...mockGage.locationInfo,
        floodEvents: [...mockGage.locationInfo.floodEvents],
      },
    };
    await act(async () => {
      rerender(<GageDetailsChart gage={updatedGage} />);
    });

    expect(capturedPickerSelectedValue).toBe(SELECT_EVENT);
  });

  it("Picker shows SELECT_EVENT on cold-load (no params)", () => {
    mockParamsBox.current = {};
    render(<GageDetailsChart gage={mockGage} />);
    expect(capturedPickerSelectedValue).toBe(SELECT_EVENT);
  });
});
