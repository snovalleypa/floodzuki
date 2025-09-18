import React from "react";
import { Platform } from "react-native";

import { Cell } from "@common-ui/components/Common";
// Use direct import othervise it'll break the web build
import MapView from "react-native-maps/lib/MapView";

const MapReactNative = React.forwardRef((props: any, ref: any) => {
  return Platform.select({
    default: () => <Cell {...props} />,
    ios: () => <MapView ref={ref} {...props} />,
    android: () => <MapView ref={ref} {...props} />
  })()
})

export default MapReactNative;
