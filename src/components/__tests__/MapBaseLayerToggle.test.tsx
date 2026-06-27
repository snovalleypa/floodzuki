import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import MapBaseLayerToggle from "../MapBaseLayerToggle";
import { MapBaseLayer } from "@models/MapModels";

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));

// The thumbnail button renders an expo-image; stub it so the test doesn't need
// the native image module.
jest.mock("expo-image", () => ({
  __esModule: true,
  Image: () => null,
}));

describe("MapBaseLayerToggle", () => {
  it("labels the satellite target when currently on Map", () => {
    const { getByText } = render(
      <MapBaseLayerToggle baseLayer={MapBaseLayer.Map} onPress={jest.fn()} />
    );
    expect(getByText("map.baseLayer.satellite")).toBeTruthy();
  });

  it("labels the map target when currently on Satellite", () => {
    const { getByText } = render(
      <MapBaseLayerToggle baseLayer={MapBaseLayer.Satellite} onPress={jest.fn()} />
    );
    expect(getByText("map.baseLayer.map")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MapBaseLayerToggle baseLayer={MapBaseLayer.Map} onPress={onPress} />
    );
    fireEvent.press(getByTestId("baseLayerToggle"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
