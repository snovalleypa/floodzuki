// src/components/__tests__/GageDetailsChart.date-sync.test.tsx
import React from "react";
import { render, act } from "@testing-library/react-native";
import { GageDetailsChart } from "../GageDetailsChart";
import localDayJs from "@services/localDayJs";

let capturedOnChange: ((start: any, end: any) => void) | undefined;
let latestStartDate: any;

let mockParams: { from?: string; to?: string; historicEventId?: string } = {};
const mockSetParams = jest.fn((patch: Record<string, string | undefined>) => {
  mockParams = { ...mockParams, ...patch };
  // Strip undefined values so useLocalSearchParams sees them as absent
  Object.keys(patch).forEach((k) => {
    if (patch[k] === undefined) {
      delete (mockParams as any)[k];
    }
  });
});

jest.mock("../DatePickerVariantSwitch", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedOnChange = props.onChange;
    latestStartDate = props.startDate;
    return null;
  },
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    isDataFetched: true,
    getTimezone: () => "America/Los_Angeles",
    gagesStore: { fetchDataForGage: jest.fn(), isFetching: false },
  }),
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ setParams: mockSetParams }),
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
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: any) => children,
}));
jest.mock("@react-native-picker/picker", () => ({ Picker: () => null }));
jest.mock("@common-ui/components/SegmentControl", () => ({
  SegmentControl: () => null,
}));
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

describe("GageDetailsChart — split picker date sync", () => {
  beforeEach(() => {
    capturedOnChange = undefined;
    latestStartDate = undefined;
    mockParams = {};
    mockSetParams.mockClear();
  });

  it("writes the user-picked dates to the URL as YYYY-MM-DD", async () => {
    render(<GageDetailsChart gage={mockGage} />);

    const tz = "America/Los_Angeles";
    const pickedStart = localDayJs.tz("2026-05-20", "YYYY-MM-DD", tz).startOf("day");
    const pickedEnd = localDayJs.tz("2026-05-21", "YYYY-MM-DD", tz).startOf("day");

    await act(async () => {
      capturedOnChange?.(pickedStart, pickedEnd);
    });

    expect(mockSetParams).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "2026-05-20",
        to: "2026-05-21",
        historicEventId: undefined,
      })
    );
  });

  it("reflects the picked start date in the picker's startDate prop after URL roundtrip", async () => {
    const tz = "America/Los_Angeles";
    const pickedStart = localDayJs.tz("2026-05-20", "YYYY-MM-DD", tz).startOf("day");
    const pickedEnd = localDayJs.tz("2026-05-21", "YYYY-MM-DD", tz).startOf("day");

    const { rerender } = render(<GageDetailsChart gage={mockGage} />);

    await act(async () => {
      capturedOnChange?.(pickedStart, pickedEnd);
    });

    // Force a re-render so useLocalSearchParams picks up the new mockParams
    rerender(<GageDetailsChart gage={mockGage} />);

    expect(latestStartDate?.tz(tz).format("YYYY-MM-DD")).toBe("2026-05-20");
  });

  it("reflects historic URL params on page load", () => {
    mockParams = { from: "2020-02-04", to: "2020-02-13" };
    const tz = "America/Los_Angeles";

    render(<GageDetailsChart gage={mockGage} />);

    expect(latestStartDate?.tz(tz).format("YYYY-MM-DD")).toBe("2020-02-04");
  });
});
