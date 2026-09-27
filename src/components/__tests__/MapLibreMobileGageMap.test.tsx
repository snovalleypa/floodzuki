import React from "react";
import { render } from "@testing-library/react-native";

import MapLibreMobileGageMap from "../MapLibreMobileGageMap";

// Capture the props handed to the native Marker/Camera. Fabric's prop parser
// (folly::dynamic) hard-crashes the app on a `null` inside `lngLat`, so the
// assertions below are the JS-side stand-in for "iOS did not abort".
const markerProps: { lngLat: unknown }[] = [];
const cameraProps: { bounds: unknown }[] = [];

jest.mock("@maplibre/maplibre-react-native", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    Map: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Camera: (props: { bounds: unknown }) => {
      cameraProps.push(props);
      return null;
    },
    GeoJSONSource: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Layer: () => null,
    Marker: (props: { lngLat: unknown; children?: React.ReactNode }) => {
      markerProps.push(props);
      return <View testID="marker">{props.children}</View>;
    },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const chain: Record<string, unknown> = {};
  chain.onTouchesDown = () => chain;
  chain.onTouchesUp = () => chain;
  chain.onTouchesCancelled = () => chain;
  return {
    __esModule: true,
    Gesture: { Manual: () => chain },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  runOnJS: (fn: unknown) => fn,
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock("../MapPinIcon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="pin" /> };
});

const located = { locationId: "USGS-38", latitude: 47.545, longitude: -121.842 } as never;
// An admin-only/test gauge whose location record carries no coordinates.
const unlocated = { locationId: "SVPA-TEST", latitude: undefined, longitude: undefined } as never;

// Numbers Fabric would accept but that aren't real locations — a backend default
// of 0 would otherwise put a pin in the Gulf of Guinea.
const zeroed = { locationId: "SVPA-ZERO", latitude: 0, longitude: 0 } as never;
const notANumber = { locationId: "SVPA-NAN", latitude: NaN, longitude: -121.9 } as never;

const region = { id: 1 } as never;

const baseProps = {
  region,
  onGagePress: () => {},
  useCooperativeGestures: false,
  inundationUrl: null,
  roadClosuresUrl: null,
  modelBoundaryUrl: null,
  baseLayer: "map" as never,
};

beforeEach(() => {
  markerProps.length = 0;
  cameraProps.length = 0;
});

describe("MapLibreMobileGageMap — gauges without coordinates", () => {
  it("does not hand the native Marker an undefined coordinate", () => {
    render(<MapLibreMobileGageMap {...baseProps} gages={[located, unlocated]} singleGage={null} />);

    for (const { lngLat } of markerProps) {
      expect(lngLat).toEqual([expect.any(Number), expect.any(Number)]);
    }
    // The located gauge still gets its pin; only the coordinate-less one is skipped.
    expect(markerProps).toHaveLength(1);
    expect(markerProps[0].lngLat).toEqual([-121.842, 47.545]);
  });

  it("skips gauges whose coordinates are 0 or NaN", () => {
    render(
      <MapLibreMobileGageMap
        {...baseProps}
        gages={[located, zeroed, notANumber]}
        singleGage={null}
      />
    );

    expect(markerProps.map((p) => p.lngLat)).toEqual([[-121.842, 47.545]]);
  });

  it("falls back to region bounds when the single gauge's coordinates are 0", () => {
    const regionWithBounds = {
      id: 1,
      defaultMobileMapBounds: [-122.3, 46.9, -121.2, 48.3],
    } as never;

    render(
      <MapLibreMobileGageMap
        {...baseProps}
        region={regionWithBounds}
        gages={[zeroed]}
        singleGage={zeroed}
      />
    );

    expect(cameraProps[0].bounds).toEqual([-122.3, 46.9, -121.2, 48.3]);
  });

  it("falls back to region bounds when the single gauge has no coordinates", () => {
    const regionWithBounds = {
      id: 1,
      defaultMobileMapBounds: [-122.3, 46.9, -121.2, 48.3],
    } as never;

    render(
      <MapLibreMobileGageMap
        {...baseProps}
        region={regionWithBounds}
        gages={[unlocated]}
        singleGage={unlocated}
      />
    );

    expect(cameraProps[0].bounds).toEqual([-122.3, 46.9, -121.2, 48.3]);
  });
});
