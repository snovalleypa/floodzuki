import React from "react";
import { act, render } from "@testing-library/react-native";
import { observable, runInAction } from "mobx";

import MapPinIcon from "../MapPinIcon";

// Stand-in for the real flood-prediction constants box: an observable that
// starts empty (as the real box does before the async load lands) and is later
// written outside of any React render. This isolates the regression (finding 1:
// MapPinIcon must be an `observer` to react to that write) from the business
// logic of useFloodRiskLevel itself, which is tested elsewhere.
const mockRiskBox = observable.box<"high" | "medium" | null>(null);

jest.mock("@utils/useFloodRiskLevel", () => ({
  useFloodRiskLevel: () => mockRiskBox.get(),
}));

jest.mock("expo-image", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    Image: (props: unknown) => <View testID="alert-pin" {...(props as object)} />,
  };
});

jest.mock("../TrendIcon", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="trend-pin" />,
    TREND_ICON_TYPES: { Map: "Map" },
  };
});

const gage = { gageStatus: { floodLevel: "Normal" } } as never;

beforeEach(() => {
  runInAction(() => mockRiskBox.set(null));
});

describe("MapPinIcon — observer wiring (finding 1)", () => {
  it("upgrades from a trend pin to an alert pin when the risk level lands, without a manual rerender", () => {
    const { queryByTestId } = render(<MapPinIcon gage={gage} />);

    // Before any risk level: falls through to the plain trend pin.
    expect(queryByTestId("trend-pin")).not.toBeNull();
    expect(queryByTestId("alert-pin")).toBeNull();

    // The box is written from outside React — exactly what the real constants
    // load does. A non-observer component would never see this: no rerender()
    // call happens here, matching the app where nothing re-triggers the map
    // marker's render after the memoized markers list is built.
    act(() => {
      runInAction(() => mockRiskBox.set("high"));
    });

    // Proof the component reacted to the box write on its own.
    expect(queryByTestId("alert-pin")).not.toBeNull();
    expect(queryByTestId("trend-pin")).toBeNull();
  });
});
