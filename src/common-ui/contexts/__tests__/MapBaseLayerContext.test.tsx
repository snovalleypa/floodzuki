import React from "react";
import { Text, Pressable } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

import { MapBaseLayer } from "@models/MapModels";
import { MapBaseLayerProvider, useMapBaseLayer } from "../MapBaseLayerContext";

function Probe() {
  const { baseLayer, setBaseLayer } = useMapBaseLayer();
  return (
    <>
      <Text testID="value">{baseLayer}</Text>
      <Pressable testID="toSatellite" onPress={() => setBaseLayer(MapBaseLayer.Satellite)}>
        <Text>go</Text>
      </Pressable>
    </>
  );
}

describe("MapBaseLayerContext", () => {
  it("defaults to Map", () => {
    const { getByTestId } = render(
      <MapBaseLayerProvider>
        <Probe />
      </MapBaseLayerProvider>
    );
    expect(getByTestId("value").props.children).toBe(MapBaseLayer.Map);
  });

  it("updates the base layer when setBaseLayer is called", () => {
    const { getByTestId } = render(
      <MapBaseLayerProvider>
        <Probe />
      </MapBaseLayerProvider>
    );
    fireEvent.press(getByTestId("toSatellite"));
    expect(getByTestId("value").props.children).toBe(MapBaseLayer.Satellite);
  });

  it("provides a safe default outside a provider", () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("value").props.children).toBe(MapBaseLayer.Map);
  });
});
