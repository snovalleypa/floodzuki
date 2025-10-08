import React from "react";
import { Platform } from "react-native";

import { Cell } from "@common-ui/components/Common";
// Use direct import othervise it'll break the web build
import MapMarker from "react-native-maps/lib/MapMarker";

const MarkerReactNative = (props: any) => Platform.select({
  default: () => <Cell {...props} />,
  ios: () => <MapMarker {...props} />,
  android: () => <MapMarker {...props} />
})()

export default MarkerReactNative;
