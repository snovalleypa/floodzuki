import { Platform } from "react-native";
import { GageMapProps } from "@models/MapModels";
import { observer } from "mobx-react-lite";
import { Gage } from "../models/Gage";
import { useMemo } from "react";

const Map = Platform.select({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ios: () => require("./MapLibreMobileGageMap").default,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  android: () => require("./MapLibreMobileGageMap").default,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: () => require("./MapLibreWebGageMap").default,
})();

const GageMap = observer(function GageMap(props: GageMapProps) {
  const { region, gages, onGagePress } = props;

  // Reverse the gauges to get the z-order to be a little friendlier...
  const reverseGages = useMemo(() => {
    return [...gages].reverse();
  }, [gages]);

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
