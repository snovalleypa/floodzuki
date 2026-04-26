import { Platform } from "react-native";
import { GageMapProps } from "@models/MapModels";
import { observer } from "mobx-react-lite";
import { Gage } from "../models/Gage";
import { useMemo } from "react";

const Map = Platform.select({
  ios: () => require("./MapLibreMobileGageMap").default,
  android: () => require("./MapLibreMobileGageMap").default,
  default: () => require("./MapLibreWebGageMap").default,
})();

const GageMap = observer(function GageMap(props: GageMapProps) {
  const { region, gages, onGagePress } = props;

  if (!gages) return null;

  // Reverse the gauges to get the z-order to be a little friendlier...
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const reverseGages = useMemo(() => {
    return [...gages].reverse();
  }, [gages]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const singleGage: Gage | null = useMemo(() => {
    if (gages.length === 1) {
      return gages[0];
    }
    return null;
  }, [gages]);

  return (
    <Map region={region} onGagePress={onGagePress} gages={reverseGages} singleGage={singleGage} />
  );
});

export default GageMap;
