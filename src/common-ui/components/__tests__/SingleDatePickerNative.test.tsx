/* eslint-disable @typescript-eslint/no-require-imports */
// src/common-ui/components/__tests__/SingleDatePickerNative.test.tsx
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import dayjs from "dayjs";
import { SingleDatePickerNative } from "../SingleDatePickerNative";

// ---------------------------------------------------------------------------
// @services/localDayJs mock — extend dayjs with the timezone plugin so that
// instances have a .tz() method (the static-only shortcut is insufficient).
// ---------------------------------------------------------------------------
jest.mock("@services/localDayJs", () => {
  const dayjsModule = require("dayjs");
  const utcPlugin = require("dayjs/plugin/utc").default ?? require("dayjs/plugin/utc");
  const tzPlugin = require("dayjs/plugin/timezone").default ?? require("dayjs/plugin/timezone");
  dayjsModule.extend(utcPlugin);
  dayjsModule.extend(tzPlugin);
  return dayjsModule;
});

// ---------------------------------------------------------------------------
// @gorhom/bottom-sheet mock (same pattern as DatePicker.native.test.tsx)
// Variable names must be prefixed with "mock" to be allowed inside jest.mock()
// factory closures after babel-jest hoisting.
// ---------------------------------------------------------------------------
const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock("@gorhom/bottom-sheet", () => {
  const ReactModule = require("react");
  const MockBottomSheetModal = ReactModule.forwardRef(({ children }: any, ref: any) => {
    ReactModule.useImperativeHandle(ref, () => ({
      present: mockPresent,
      dismiss: mockDismiss,
    }));
    return ReactModule.createElement(ReactModule.Fragment, null, children);
  });
  MockBottomSheetModal.displayName = "MockBottomSheetModal";
  const MockBottomSheetView = ({ children }: any) =>
    ReactModule.createElement(ReactModule.Fragment, null, children);
  return {
    BottomSheetModal: MockBottomSheetModal,
    BottomSheetView: MockBottomSheetView,
  };
});

// ---------------------------------------------------------------------------
// @react-native-community/datetimepicker mock
//
// DateTimePicker (default export): captures the `onChange` prop so tests can
// trigger picker changes via capturedMockPickerOnChange.
// DateTimePickerAndroid.open: delegated through mockAndroidOpenFn so the
// reference is stable across jest-mock hoisting.
// ---------------------------------------------------------------------------
const mockAndroidOpenFn: jest.Mock & {
  _capturePickerOnChange?: (event: any, date?: Date) => void;
} = jest.fn();

jest.mock("@react-native-community/datetimepicker", () => {
  const ReactModule = require("react");

  const MockDateTimePicker = ({ onChange }: any) => {
    // Store the onChange via a module-level setter so tests can trigger changes.
    // We can't reference the outer let directly (not a `mock`-prefixed name),
    // but we CAN call a mock-prefixed function as a side channel.
    mockAndroidOpenFn._capturePickerOnChange = onChange;
    return ReactModule.createElement("View", { testID: "mock-datetimepicker" }, null);
  };
  MockDateTimePicker.displayName = "MockDateTimePicker";

  return {
    __esModule: true,
    default: MockDateTimePicker,
    DateTimePickerAndroid: {
      open: (...args: any[]) => mockAndroidOpenFn(...args),
    },
  };
});

// ---------------------------------------------------------------------------
// Stub heavy UI dependencies
// ---------------------------------------------------------------------------
jest.mock("@common-ui/components/Text", () => ({
  RegularText: ({ text }: any) => {
    const ReactModule = require("react");
    const { Text } = require("react-native");
    return ReactModule.createElement(Text, { testID: "date-text" }, text);
  },
}));

jest.mock("@common-ui/components/Button", () => ({
  SolidButton: ({ title, onPress }: any) => {
    const ReactModule = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return ReactModule.createElement(
      TouchableOpacity,
      { testID: "done-button", onPress },
      ReactModule.createElement(Text, null, title)
    );
  },
}));

jest.mock("@common-ui/components/Common", () => {
  const ReactModule = require("react");
  const Pass = ({ children }: any) =>
    ReactModule.createElement(ReactModule.Fragment, null, children ?? null);
  return { Cell: Pass, Row: Pass };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native");
  return {
    ScrollView: RN.ScrollView,
    GestureHandlerRootView: RN.View,
  };
});

jest.mock("react-native-reanimated", () => ({
  measure: jest.fn(() => null),
  useAnimatedRef: () => ({ current: null }),
  default: { createAnimatedComponent: (c: any) => c },
}));

// Helper to get the captured onChange from the inline DateTimePicker mock.
// The mock stores it as a property on mockAndroidOpenFn as a side channel.
function getPickerOnChange(): ((event: any, date?: Date) => void) | null {
  return mockAndroidOpenFn._capturePickerOnChange ?? null;
}

const MOCK_PICKER_DATE = new Date("2026-05-15T00:00:00");
const MOCK_PICKER_EVENT = { type: "set", nativeEvent: {} };

const BASE_PROPS = {
  selectedDate: dayjs("2026-04-01"),
  minDate: dayjs("2026-01-01"),
  maxDate: dayjs("2026-12-31"),
  timezone: "America/Los_Angeles",
  onChange: jest.fn(),
};

// ===========================================================================
// iOS tests
// ===========================================================================
describe("SingleDatePickerNative — iOS", () => {
  beforeAll(() => {
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    mockPresent.mockClear();
    mockDismiss.mockClear();
    mockAndroidOpenFn.mockClear();
    delete mockAndroidOpenFn._capturePickerOnChange;
    BASE_PROPS.onChange.mockClear();
  });

  it("smoke: renders without crashing", () => {
    expect(() => render(<SingleDatePickerNative {...BASE_PROPS} />)).not.toThrow();
  });

  it("Done without touching picker: calls onChange with the original selectedDate", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    // Open the bottom sheet by pressing the trigger text
    fireEvent.press(getByTestId("date-text"));

    // Press Done without changing the picker value
    act(() => {
      fireEvent.press(getByTestId("done-button"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    // Should commit the same calendar day as selectedDate
    expect(result.format("YYYY-MM-DD")).toBe("2026-04-01");
  });

  it("calls onChange with new date after picker change then Done", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    // Open the sheet
    fireEvent.press(getByTestId("date-text"));

    // Simulate the inline picker emitting a new date
    act(() => {
      const pickerOnChange = getPickerOnChange();
      expect(pickerOnChange).not.toBeNull();
      pickerOnChange!(MOCK_PICKER_EVENT, MOCK_PICKER_DATE);
    });

    // Press Done
    act(() => {
      fireEvent.press(getByTestId("done-button"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    expect(result.format("YYYY-MM-DD")).toBe("2026-05-15");
  });
});

// ===========================================================================
// Android tests
// ===========================================================================
describe("SingleDatePickerNative — Android", () => {
  beforeAll(() => {
    require("react-native").Platform.OS = "android";
  });

  afterAll(() => {
    // Restore platform so other suites in the same Jest run are not affected
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    mockAndroidOpenFn.mockClear();
    BASE_PROPS.onChange.mockClear();
  });

  it("calls onChange when event.type === 'set' with a date", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    // Tap the trigger to open the Android dialog
    fireEvent.press(getByTestId("date-text"));

    expect(mockAndroidOpenFn).toHaveBeenCalledTimes(1);

    // Extract the onChange callback passed to DateTimePickerAndroid.open
    const openArgs = mockAndroidOpenFn.mock.calls[0][0];
    expect(openArgs).toHaveProperty("onChange");

    // Simulate the OS calling onChange with event.type === "set"
    act(() => {
      openArgs.onChange({ type: "set" }, new Date("2026-06-10T00:00:00"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0];
    expect(result.format("YYYY-MM-DD")).toBe("2026-06-10");
  });

  it("does NOT call onChange when event.type === 'dismissed'", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SingleDatePickerNative {...BASE_PROPS} onChange={onChange} />);

    fireEvent.press(getByTestId("date-text"));

    const openArgs = mockAndroidOpenFn.mock.calls[0][0];

    act(() => {
      openArgs.onChange({ type: "dismissed" }, undefined);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
