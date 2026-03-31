import React from "react";
import { Image } from "expo-image";
import { Gage } from "../models/Gage";
import { isWeb } from "@common-ui/utils/responsive";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  webTrendIcon: {
    width: 24,
    height: 24,
  },
  mobileTrendIcon: {
    width: 24,
    height: 24,
  },
  webMapIcon: {
    width: 54,
    height: 60,
  },
  mobileMapIcon: {
    width: 54,
    height: 60,
  },
});

export enum TREND_ICON_TYPES {
  Map = 1,
  Trend = 2,
}

export const MAP_IMAGE_ICONS = {
  rising_green: require("@assets/images/trend-icons/mapicon-rising-green.svg"),
  falling_green: require("@assets/images/trend-icons/mapicon-falling-green.svg"),
  flat_green: require("@assets/images/trend-icons/mapicon-flat-green.svg"),
  rising_yellow: require("@assets/images/trend-icons/mapicon-rising-yellow.svg"),
  falling_yellow: require("@assets/images/trend-icons/mapicon-falling-yellow.svg"),
  flat_yellow: require("@assets/images/trend-icons/mapicon-flat-yellow.svg"),
  rising_red: require("@assets/images/trend-icons/mapicon-rising-red.svg"),
  falling_red: require("@assets/images/trend-icons/mapicon-falling-red.svg"),
  flat_red: require("@assets/images/trend-icons/mapicon-flat-red.svg"),
  offline: require("@assets/images/trend-icons/mapicon-offline.svg"),
};

export const TREND_IMAGE_ICONS = {
  rising_green: require("@assets/images/trend-icons/trend-rising-green.svg"),
  falling_green: require("@assets/images/trend-icons/trend-falling-green.svg"),
  flat_green: require("@assets/images/trend-icons/trend-flat-green.svg"),
  rising_yellow: require("@assets/images/trend-icons/trend-rising-yellow.svg"),
  falling_yellow: require("@assets/images/trend-icons/trend-falling-yellow.svg"),
  flat_yellow: require("@assets/images/trend-icons/trend-flat-yellow.svg"),
  rising_red: require("@assets/images/trend-icons/trend-rising-red.svg"),
  falling_red: require("@assets/images/trend-icons/trend-falling-red.svg"),
  flat_red: require("@assets/images/trend-icons/trend-flat-red.svg"),
  offline: require("@assets/images/trend-icons/trend-offline.svg"),
};

const getGaugeIconKey = (gage: Gage): string => {
  if (gage.gageStatus.levelTrend === "Offline") {
    return "offline";
  }
  let trend = "flat";
  let color = "green";
  switch (gage.gageStatus.levelTrend) {
    case "Cresting":
    case "Status not found.":
    case "Steady":
      trend = "flat";
      break;
    case "Falling":
      trend = "falling";
      break;
    case "Rising":
      trend = "rising";
      break;
    default:
      return "offline";
  }
  switch (gage.gageStatus.floodLevel) {
    case "Offline":
      return "offline";
    case "Online":
    case "Dry":
    case "Normal":
    default:
      color = "green";
      break;
    case "NearFlooding":
      color = "yellow";
      break;
    case "Flooding":
      color = "red";
      break;
  }
  return trend + "_" + color;
};

const TrendIcon = ({ gage, iconType }: { gage: Gage; iconType: TREND_ICON_TYPES }) => {
  const iconKey = getGaugeIconKey(gage);
  let icon;
  if (iconType === TREND_ICON_TYPES.Map) {
    icon = MAP_IMAGE_ICONS[iconKey];
  } else {
    icon = TREND_IMAGE_ICONS[iconKey];
  }
  if (isWeb) {
    return (
      <img
        src={icon}
        style={iconType === TREND_ICON_TYPES.Map ? styles.webMapIcon : styles.webTrendIcon}
      />
    );
  }
  return (
    <Image
      source={icon}
      style={iconType === TREND_ICON_TYPES.Map ? styles.mobileMapIcon : styles.mobileTrendIcon}
    />
  );
};

export default TrendIcon;
