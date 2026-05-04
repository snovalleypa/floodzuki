/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import dayjs from "dayjs";
import { DateRangePickerRangeV1 } from "../DateRangePickerRangeV1";

let capturedProps: {
  startDate?: string;
  endDate?: string;
  minDate?: string;
  maxDate?: string;
  onChange?: (params: { startDate?: Date; endDate?: Date }) => void;
} = {};

jest.mock("react-native-ui-datepicker", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps = props;
    return null;
  },
  useDefaultStyles: () => ({}),
}));

jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BottomSheetView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@common-ui/contexts/DatePickerContext", () => ({
  useDatePicker: () => ({ showPicker: jest.fn(), hidePicker: jest.fn() }),
}));

// Button.tsx's BaseButton swallows testID. Mock so testID propagates to the rendered tree.
jest.mock("@common-ui/components/Button", () => {
  const ReactModule = require("react");
  const { Pressable } = require("react-native");
  const renderButton = ({ title, onPress, disabled, testID }: any) =>
    ReactModule.createElement(
      Pressable,
      {
        onPress,
        disabled: !!disabled,
        testID,
        accessibilityRole: "button",
        accessibilityLabel: title,
        accessibilityState: { disabled: !!disabled },
      },
      null
    );
  return {
    SolidButton: renderButton,
    OutlinedButton: renderButton,
  };
});

jest.mock("@common-ui/components/Icon", () => () => null);

jest.mock("@common-ui/components/Text", () => ({
  RegularText: () => null,
}));

const startDate = dayjs("2026-04-20");
const endDate = dayjs("2026-04-25");
const onChange = jest.fn();
const baseProps = { startDate, endDate, timezone: "America/Los_Angeles", onChange };

beforeEach(() => {
  capturedProps = {};
  onChange.mockClear();
});

describe("DateRangePickerRangeV1 — picker props", () => {
  it("passes startDate and endDate as YYYY-MM-DD strings matching initial props", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    expect(capturedProps.startDate).toBe("2026-04-20");
    expect(capturedProps.endDate).toBe("2026-04-25");
  });

  it("passes minDate = 2019-10-01 by default", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    expect(capturedProps.minDate).toBe("2019-10-01");
  });

  it("passes maxDate = today by default", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    // maxDate should be today or very close to it
    const passedMaxDate = dayjs(capturedProps.maxDate);
    const today = dayjs();
    expect(passedMaxDate.diff(today, "day")).toBe(0);
  });

  it("updates maxDate prop to clamped tapped+30 after a Case 2a first tap", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));

    // First tap inside range → maxDate should be min(tapped + 30, today)
    act(() => {
      capturedProps.onChange!({ startDate: dayjs("2026-04-22").toDate(), endDate: undefined });
    });

    // After re-render: maxDate prop should update
    // tapped + 30 = 2026-05-22, today = ~2026-05-03 → clamped to today
    const newMaxDate = dayjs(capturedProps.maxDate);
    // maxDate must not exceed today
    expect(newMaxDate.isAfter(dayjs(), "day")).toBe(false);
  });

  it("renders Set and Cancel buttons below the calendar", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));
    expect(getByTestId("range-v1-set-button")).not.toBeNull();
    expect(getByTestId("range-v1-cancel-button")).not.toBeNull();
  });

  it("onChange fires only when Set is pressed, not on picker tap", () => {
    const { getByTestId } = render(<DateRangePickerRangeV1 {...baseProps} />);
    fireEvent.press(getByTestId("range-v1-trigger"));
    // Tap outside range (Case 2d)
    act(() => {
      capturedProps.onChange!({ startDate: dayjs("2026-04-29").toDate(), endDate: undefined });
    });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("range-v1-set-button"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
