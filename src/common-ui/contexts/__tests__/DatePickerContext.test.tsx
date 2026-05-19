// src/common-ui/contexts/__tests__/DatePickerContext.test.tsx
import React from "react";
import { render, act, fireEvent } from "@testing-library/react-native";
import { View, Text, Button } from "react-native";
import { DatePickerProvider, useDatePicker } from "../DatePickerContext";

let mockPathname = "/gage/USGS-NF10";

jest.mock("expo-router", () => ({
  usePathname: () => mockPathname,
}));

const TestConsumer = () => {
  const { isVisible, showPicker } = useDatePicker();
  return (
    <View>
      <Text testID="visible">{String(isVisible)}</Text>
      <Button testID="show" title="Show" onPress={() => showPicker(<Text>picker content</Text>)} />
    </View>
  );
};

const renderWithProvider = () =>
  render(
    <DatePickerProvider>
      <TestConsumer />
    </DatePickerProvider>
  );

describe("DatePickerProvider — navigation dismissal", () => {
  beforeEach(() => {
    mockPathname = "/gage/USGS-NF10";
  });

  it("hides the picker when the pathname changes (navigating away)", () => {
    const { getByTestId, rerender } = renderWithProvider();

    act(() => {
      fireEvent.press(getByTestId("show"));
    });

    expect(getByTestId("visible").props.children).toBe("true");

    mockPathname = "/forecast";
    act(() => {
      rerender(
        <DatePickerProvider>
          <TestConsumer />
        </DatePickerProvider>
      );
    });

    expect(getByTestId("visible").props.children).toBe("false");
  });

  it("does not hide the picker when the pathname stays the same", () => {
    const { getByTestId, rerender } = renderWithProvider();

    act(() => {
      fireEvent.press(getByTestId("show"));
    });

    expect(getByTestId("visible").props.children).toBe("true");

    act(() => {
      rerender(
        <DatePickerProvider>
          <TestConsumer />
        </DatePickerProvider>
      );
    });

    expect(getByTestId("visible").props.children).toBe("true");
  });
});
