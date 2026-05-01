import React from "react";
import { render, act } from "@testing-library/react-native";
import dayjs, { Dayjs } from "dayjs";
import DateRangePicker from "../DateRangePicker";

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

jest.mock("../Icon", () => () => null);

jest.mock("../Text", () => ({
  RegularText: () => null,
}));

jest.mock("../Common", () => {
  const React = require("react");
  return {
    Cell: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

// Capture onChange callbacks keyed by picker title so tests can invoke them
const pickerRegistry: Record<string, (date: Dayjs) => void> = {};

jest.mock("../DatePicker", () => {
  const React = require("react");
  const MockDatePicker = React.forwardRef((props: any, ref: any) => {
    const key = props.title ?? "unknown";
    pickerRegistry[key] = props.onChange;
    React.useImperativeHandle(ref, () => ({
      open: jest.fn(),
      close: jest.fn(),
      isPickerOpen: jest.fn(() => false),
    }));
    return React.createElement(
      "Text",
      { testID: `date-picker-${key}` },
      props.selectedDate?.format("MM/DD/YYYY") ?? ""
    );
  });
  MockDatePicker.displayName = "MockDatePicker";
  return {
    __esModule: true,
    default: MockDatePicker,
  };
});

const jan1 = dayjs("2022-01-01");
const jan31 = dayjs("2022-01-31");

describe("DateRangePicker", () => {
  it("renders the formatted start and end dates from initial props", () => {
    const { getByTestId } = render(
      <DateRangePicker startDate={jan1} endDate={jan31} onChange={jest.fn()} />
    );

    expect(getByTestId("date-picker-datePicker.startDate").props.children).toBe("01/01/2022");
    expect(getByTestId("date-picker-datePicker.endDate").props.children).toBe("01/31/2022");
  });

  it("updates the displayed start date when startDate prop changes externally", () => {
    const onChange = jest.fn();
    const { rerender, getByTestId } = render(
      <DateRangePicker startDate={jan1} endDate={jan31} onChange={onChange} />
    );

    rerender(
      <DateRangePicker startDate={dayjs("2021-11-15")} endDate={jan31} onChange={onChange} />
    );

    expect(getByTestId("date-picker-datePicker.startDate").props.children).toBe("11/15/2021");
  });

  it("updates the displayed end date when endDate prop changes externally", () => {
    const onChange = jest.fn();
    const { rerender, getByTestId } = render(
      <DateRangePicker startDate={jan1} endDate={jan31} onChange={onChange} />
    );

    rerender(
      <DateRangePicker startDate={jan1} endDate={dayjs("2022-03-15")} onChange={onChange} />
    );

    expect(getByTestId("date-picker-datePicker.endDate").props.children).toBe("03/15/2022");
  });

  it("calls onChange with selected start and end dates after user picks both", () => {
    const onChange = jest.fn();
    render(<DateRangePicker startDate={jan1} endDate={jan31} onChange={onChange} />);

    act(() => {
      pickerRegistry["datePicker.startDate"]?.(dayjs("2022-06-01"));
    });
    act(() => {
      pickerRegistry["datePicker.endDate"]?.(dayjs("2022-06-30"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [calledStart, calledEnd] = onChange.mock.calls[0] as [Dayjs, Dayjs];
    expect(calledStart.format("YYYY-MM-DD")).toBe("2022-06-01");
    expect(calledEnd.format("YYYY-MM-DD")).toBe("2022-06-30");
  });

  it("clamps end date to start + maxRange days when selection exceeds the limit", () => {
    const onChange = jest.fn();
    render(<DateRangePicker startDate={jan1} endDate={jan31} maxRange={30} onChange={onChange} />);

    act(() => {
      pickerRegistry["datePicker.startDate"]?.(dayjs("2022-06-01"));
    });
    act(() => {
      // 59 days after 2022-06-01 — exceeds maxRange=30, should clamp to 2022-07-01
      pickerRegistry["datePicker.endDate"]?.(dayjs("2022-07-30"));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [, calledEnd] = onChange.mock.calls[0] as [Dayjs, Dayjs];
    expect(calledEnd.format("YYYY-MM-DD")).toBe("2022-07-01");
  });
});
