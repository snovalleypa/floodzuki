import React from "react";
import { Image } from "expo-image";
import { observer } from "mobx-react-lite";
import { StyleSheet } from "react-native";

import { Gage } from "@models/Gage";
import { isWeb } from "@common-ui/utils/responsive";
import { useFloodRiskLevel } from "@utils/useFloodRiskLevel";

import TrendIcon, { TREND_ICON_TYPES } from "./TrendIcon";

const styles = StyleSheet.create({
  // Same footprint as the trend map pins (viewBox 72 x 78.14).
  icon: { width: 54, height: 60 },
});

/**
 * Composite alert map pins: the pin body color tracks the gauge's flood level
 * (green / yellow), the centered triangle tracks the chance-of-flooding risk
 * (high = red, medium = orange). Keyed `${risk}_${base}`.
 */
export const ALERT_MAP_ICONS = {
  high_green: require("@assets/images/trend-icons/mapicon-alert-high-green.svg"),
  medium_green: require("@assets/images/trend-icons/mapicon-alert-medium-green.svg"),
  high_yellow: require("@assets/images/trend-icons/mapicon-alert-high-yellow.svg"),
  medium_yellow: require("@assets/images/trend-icons/mapicon-alert-medium-yellow.svg"),
};

/**
 * Pin base color for the alert icon, from the live flood level. Null for
 * Flooding / Offline — those have no green/yellow alert pin (and a gauge already
 * flooding has no forward-looking chance anyway, so risk is null there too).
 */
function alertBaseColor(floodLevel?: string): "green" | "yellow" | null {
  switch (floodLevel) {
    case "Online":
    case "Dry":
    case "Normal":
      return "green";
    case "NearFlooding":
      return "yellow";
    default:
      return null;
  }
}

/**
 * Map-pin content for a gauge: the chance-of-flooding alert pin when the risk is
 * High/Medium (and the gauge isn't flooding/offline), otherwise the usual trend
 * pin. Its own component so `useFloodRiskLevel` runs per marker (markers are
 * built in a `.map`, where hooks can't be called directly).
 *
 * Must be an `observer`: it reads the flood-prediction constants box (via
 * `useFloodRiskLevel`) during render, and that box can still be empty on first
 * render (the constants load is async and non-blocking). Without `observer`,
 * the later box write never re-renders this component, and — since its element
 * is built inside a `useMemo` in the map components — the marker would never
 * upgrade from a trend pin to an alert pin for the rest of the session.
 */
const MapPinIcon = observer(function MapPinIcon({ gage }: { gage: Gage }) {
  const riskLevel = useFloodRiskLevel(gage);
  const base = riskLevel ? alertBaseColor(gage?.gageStatus?.floodLevel) : null;

  if (riskLevel && base) {
    const icon = ALERT_MAP_ICONS[`${riskLevel}_${base}` as keyof typeof ALERT_MAP_ICONS];
    if (isWeb) {
      return <img src={icon} style={styles.icon} />;
    }
    return <Image source={icon} style={styles.icon} />;
  }
  return <TrendIcon gage={gage} iconType={TREND_ICON_TYPES.Map} />;
});

export default MapPinIcon;
