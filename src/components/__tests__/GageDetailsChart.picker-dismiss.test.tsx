// src/components/__tests__/GageDetailsChart.picker-dismiss.test.tsx
import React from "react";
import { render, act, fireEvent } from "@testing-library/react-native";
import { GageDetailsChart } from "../GageDetailsChart";

const mockHidePicker = jest.fn();

// --- DatePickerContext mock ---
jest.mock("@common-ui/contexts/DatePickerContext", () => ({
  useDatePicker: () => ({
    isVisible: false,
    showPicker: jest.fn(),
    hidePicker: mockHidePicker,
  }),
}));

// --- Store mock ---
jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: true,
    getTimezone: () => "America/Los_Angeles",
    gagesStore: {
      fetchDataForGage: jest.fn(),
      isFetching: false,
    },
  }),
}));

// --- Expo Router mock ---
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ from: undefined, to: undefined, historicEventId: undefined }),
  useRouter: () => ({ setParams: jest.fn() }),
}));

// --- UI mocks ---
jest.mock("@services/highcharts/LocalHighchartsReact", () => () => null);
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
jest.mock("@common-ui/components/DateRangePicker", () => () => null);
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

// SegmentControl mock: renders a Pressable for each segment so tests can press them
jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: ({ onChange, segments }: any) => {
    const React = require("react");
    const { Pressable } = require("react-native");
    return (segments ?? []).map((s: any) =>
      React.createElement(Pressable, {
        key: s.key,
        testID: `segment-option-${s.key}`,
        onPress: () => onChange?.(s.key),
      })
    );
  },
}));

// Picker mock: renders a Pressable that fires onValueChange with a specific event id
jest.mock("@react-native-picker/picker", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  const PickerMock = ({ onValueChange }: any) =>
    React.createElement(Pressable, {
      testID: "historical-event-picker",
      onPress: () => onValueChange?.("22"),
    });
  PickerMock.Item = function PickerItem() {
    return null;
  };
  return { Picker: PickerMock };
});

const mockGage: any = {
  locationId: "USGS-NF10",
  locationInfo: {
    floodEvents: [
      { id: 22, eventName: "February 2020 Flood", fromDate: "2020-02-04", toDate: "2020-02-13" },
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

describe("GageDetailsChart — picker dismissal", () => {
  beforeEach(() => {
    mockHidePicker.mockClear();
  });

  it("calls hidePicker when a range segment option is selected", () => {
    const { getByTestId } = render(<GageDetailsChart gage={mockGage} />);

    // RANGES keys are "14", "7", "2", "1" — press the "14" day segment
    act(() => {
      fireEvent.press(getByTestId("segment-option-14"));
    });

    expect(mockHidePicker).toHaveBeenCalled();
  });

  it("calls hidePicker when a historical flood event is selected", () => {
    const { getByTestId } = render(<GageDetailsChart gage={mockGage} />);

    act(() => {
      fireEvent.press(getByTestId("historical-event-picker"));
    });

    expect(mockHidePicker).toHaveBeenCalled();
  });
});
