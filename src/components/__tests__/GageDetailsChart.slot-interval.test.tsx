// src/components/__tests__/GageDetailsChart.slot-interval.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { GageDetailsChart } from "../GageDetailsChart";
import { ChainPagerSlotContext } from "../ChainPagerSlot";

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
jest.mock("@utils/useGageChartOptions", () => ({ __esModule: true, default: () => [{}, null] }));

// Capture useInterval calls so we can assert what delay it was passed.
const mockUseInterval = jest.fn();
jest.mock("@utils/useTimeout", () => ({
  useTimeout: jest.fn(),
  useInterval: (cb: any, delay: any) => mockUseInterval(cb, delay),
}));

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
  __esModule: true,
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

function lastIntervalDelay() {
  const calls = mockUseInterval.mock.calls;
  return calls[calls.length - 1]?.[1];
}

describe("GageDetailsChart — live-refresh interval gating by slot isCurrent", () => {
  beforeEach(() => {
    mockParamsBox.current = {}; // cold-load → range.isNow = true
    mockSetParams.mockClear();
    mockUseInterval.mockClear();
  });

  it("uses the configured interval when the slot is current (default, no provider)", () => {
    render(<GageDetailsChart gage={mockGage} />);
    expect(lastIntervalDelay()).toBe(60000);
  });

  it("uses the configured interval when explicitly isCurrent=true", () => {
    render(
      <ChainPagerSlotContext.Provider value={{ isCurrent: true }}>
        <GageDetailsChart gage={mockGage} />
      </ChainPagerSlotContext.Provider>
    );
    expect(lastIntervalDelay()).toBe(60000);
  });

  it("disables the interval (delay=null) when the slot is offscreen", () => {
    render(
      <ChainPagerSlotContext.Provider value={{ isCurrent: false }}>
        <GageDetailsChart gage={mockGage} />
      </ChainPagerSlotContext.Provider>
    );
    expect(lastIntervalDelay()).toBeNull();
  });

  it("still disables the interval when range is not 'now', even if current", () => {
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-13" }; // historic range
    render(
      <ChainPagerSlotContext.Provider value={{ isCurrent: true }}>
        <GageDetailsChart gage={mockGage} />
      </ChainPagerSlotContext.Provider>
    );
    expect(lastIntervalDelay()).toBeNull();
  });
});
