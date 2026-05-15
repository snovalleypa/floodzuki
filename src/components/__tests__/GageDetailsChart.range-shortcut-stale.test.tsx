// Regression: clicking a segment shortcut must read the CURRENT range,
// not a stale one held by SegmentItem's memo bail-out.
//
// Repro:
//   1. Render with historic range [Feb 4, Feb 6] (3 days).
//   2. Click "1d" → URL becomes [Feb 5, Feb 5] (center of 3-day).
//   3. Update mockParams and rerender.
//   4. Click "2d" → must produce [Feb 5, Feb 6] (center of 1-day, +1 after),
//      NOT a window derived from the stale 3-day range.
//
// This uses the REAL SegmentControl so the SegmentItem memo path is exercised.

import React from "react";
import { fireEvent, render, act } from "@testing-library/react-native";
import { GageDetailsChart } from "../GageDetailsChart";

const mockParamsBox: { current: { from?: string; to?: string; historicEventId?: string } } = {
  current: {},
};
const mockSetParams = jest.fn((patch: Record<string, string | undefined>) => {
  const next = { ...mockParamsBox.current, ...patch };
  Object.keys(patch).forEach((k) => {
    if (patch[k] === undefined) {
      delete (next as any)[k];
    }
  });
  mockParamsBox.current = next;
});

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
  useLocale: () => ({
    t: (k: string, params?: { days?: number }) => (params?.days ? `${params.days} ${k}` : k),
  }),
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
// Text and Pressable are needed by the real SegmentControl, so don't mock them away.
jest.mock("@common-ui/components/Text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Pass = (props: any) => React.createElement(Text, null, props.children ?? null);
  return {
    MediumText: Pass,
    RegularText: Pass,
    SmallerText: Pass,
    LabelText: Pass,
    MediumTitle: (props: any) =>
      React.createElement(Text, { testID: props.testID }, props.children ?? null),
    SmallTitle: (props: any) =>
      React.createElement(Text, { testID: props.testID }, props.children ?? null),
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

// Find a Pressable rendered by the real SegmentControl whose child text matches the given key.
// The RANGES list maps "1" → "1 day", others → "Days" pluralized. We just look at the rendered
// text containing the digit at the start.
function findSegment(getAllByText: (m: any) => any[], key: string) {
  // SegmentControl rendered titles look like "1 day", "2 days", "7 days", "14 days".
  // Match against the rendered title key with a word boundary so "1" doesn't also match "14".
  const candidates = getAllByText(new RegExp(`^${key}\\b`));
  // Walk up to the Pressable (the parent of the title Text).
  return candidates[0].parent;
}

describe("GageDetailsChart — segment shortcut closure freshness (regression)", () => {
  beforeEach(() => {
    mockParamsBox.current = {};
    mockSetParams.mockClear();
  });

  it("uses the CURRENT range when clicking a segment after a URL change", async () => {
    // Start with a historic 3-day range.
    mockParamsBox.current = { from: "2020-02-04", to: "2020-02-06" };
    const { getAllByText, rerender } = render(<GageDetailsChart gage={mockGage} />);

    // Click "1d" — should write the center of [Feb 4, Feb 6] = Feb 5.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "1"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-05", to: "2020-02-05" })
    );

    // mockSetParams already updated mockParamsBox. Re-render so useLocalSearchParams sees it.
    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "2d" — should now use the CURRENT range [Feb 5, Feb 5], center Feb 5,
    // producing [Feb 5, Feb 6] (0 before, 1 after). Bug would produce a window
    // computed from the stale 3-day range — e.g. [Feb 5, Feb 6] from old center Feb 5
    // happens to coincide, so use a more discriminating test instead.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "2"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-05", to: "2020-02-06" })
    );
  });

  it("uses CURRENT range across multiple shortcut clicks (discriminating case)", async () => {
    // Pick an asymmetric historic range so the centers of pre/post states differ.
    // Initial: [Feb 1, Feb 11] (11 days) → center = Feb 1 + floor(11/2) = Feb 6.
    mockParamsBox.current = { from: "2020-02-01", to: "2020-02-11" };
    const { getAllByText, rerender } = render(<GageDetailsChart gage={mockGage} />);

    // Click "1d" — center Feb 6 → [Feb 6, Feb 6].
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "1"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-06", to: "2020-02-06" })
    );

    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "14d" — must center on Feb 6 (new center), producing Feb 6 - 6 = Jan 31
    // to Feb 6 + 7 = Feb 13. If the handler is stale and reads the old 11-day range,
    // it would still center on Feb 6 and produce the same answer — so use 7d instead
    // for a discriminating case.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "7"));
    });
    // Center Feb 6 (from current [Feb 6, Feb 6]) → [Feb 3, Feb 9] (3 before / 3 after).
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-03", to: "2020-02-09" })
    );

    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // Click "2d" again. Current range is [Feb 3, Feb 9] (7 days) → center = Feb 6.
    // 2d → [Feb 6, Feb 7]. If stale (still reading [Feb 6, Feb 6] from before 7d),
    // it would also produce [Feb 6, Feb 7]. So use 14d to get a different answer.
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "14"));
    });
    // Current [Feb 3, Feb 9] (7 days), center Feb 6, 14d → 6 before/7 after → [Jan 31, Feb 13].
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-01-31", to: "2020-02-13" })
    );

    rerender(<GageDetailsChart gage={{ ...mockGage }} />);

    // NOW the discriminating click: with current range [Jan 31, Feb 13] (14 days),
    // center = Jan 31 + floor(14/2) = Feb 7. Click "2d" → [Feb 7, Feb 8] (0 before / 1 after).
    // If the handler is stale and reads the 7-day [Feb 3, Feb 9] (center Feb 6), it would
    // write [Feb 6, Feb 7]. Different from [Feb 7, Feb 8].
    await act(async () => {
      fireEvent.press(findSegment(getAllByText, "2"));
    });
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: "2020-02-07", to: "2020-02-08" })
    );
  });
});
