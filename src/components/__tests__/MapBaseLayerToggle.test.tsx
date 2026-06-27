import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import MapBaseLayerToggle from "../MapBaseLayerToggle";
import { MapBaseLayer } from "@models/MapModels";

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));

// Icon renders an @expo/vector-icons glyph; stub to a plain view to keep the
// test light and avoid font loading.
jest.mock("@common-ui/components/Icon", () => ({
  __esModule: true,
  default: () => null,
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
