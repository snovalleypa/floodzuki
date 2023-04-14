import React, { useEffect, useRef, useState } from "react";
import { isWeb } from "@common-ui/utils/responsive"
import { Platform, View } from "react-native";

import { Cell } from "@common-ui/components/Common";
// Use direct import othervise it'll break the web build
import MapView from "react-native-maps/lib/MapView";


const MapReactNative = (props: any) => {
  return Platform.select({
    default: () => <Cell {...props} />,
    ios: () => <MapView {...props} />,
    android: () => <MapView {...props} />
  })()
}

export default MapReactNative;
