import React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, ViewStyle } from "react-native";

import { isWeb } from "@common-ui/utils/responsive";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { FloodRiskLevel } from "@services/floodPrediction/types";
import { TxKeyPath } from "@i18n/i18n";

// Halo variants (white outline) overlay a colored status pill; the flat no-halo
// variants sit inline next to the percentage. Registered in AssetsContext for
// preloading, same as the trend icons.
export const ALERT_BADGE_ICONS = {
  high_halo: require("@assets/images/alert-high.svg"),
  medium_halo: require("@assets/images/alert-medium.svg"),
  high_no_halo: require("@assets/images/alert-high-no-halo.svg"),
  medium_no_halo: require("@assets/images/alert-medium-no-halo.svg"),
};

const OVERLAY_SIZE = 22;
const INLINE_SIZE = 18;
const PIN_SIZE = 46;

type Variant = "overlay" | "inline" | "pin";

const styles = StyleSheet.create({
  overlay: { width: OVERLAY_SIZE, height: OVERLAY_SIZE },
  inline: { width: INLINE_SIZE, height: INLINE_SIZE },
  pin: { width: PIN_SIZE, height: PIN_SIZE },
});

function iconKey(level: FloodRiskLevel, variant: Variant): keyof typeof ALERT_BADGE_ICONS | null {
  // Halo variants (white outline) read clearly over a colored pill or the map;
  // the flat no-halo variant is for inline text.
  const halo = variant !== "inline";
  if (level === FloodRiskLevel.High) {
    return halo ? "high_halo" : "high_no_halo";
  }
  if (level === FloodRiskLevel.Medium) {
    return halo ? "medium_halo" : "medium_no_halo";
  }
  return null;
}

/**
 * A small triangular "chance of flooding" badge. Renders nothing for Low risk.
 * `overlay` uses the haloed icon (for a status-pill corner); `inline` uses the
 * flat icon (next to the percentage). Web `<img>` / mobile expo-image, matching
 * the TrendIcon pattern.
 */
const FloodRiskBadge = ({ level, variant }: { level: FloodRiskLevel; variant: Variant }) => {
  const { t } = useLocale();
  const key = iconKey(level, variant);
  if (!key) {
    return null;
  }

  const icon = ALERT_BADGE_ICONS[key];
  const style = styles[variant];
  const label = t(
    (level === FloodRiskLevel.High ? "floodRisk.highBadge" : "floodRisk.mediumBadge") as TxKeyPath
  );

  if (isWeb) {
    return <img src={icon} style={style as React.CSSProperties} alt={label} />;
  }
  return <Image source={icon} style={style} accessibilityLabel={label} />;
};

/**
 * Wrap a status pill so the overlay badge floats at its top-right corner when the
 * risk is High/Medium. Passes children through unchanged for Low / no risk.
 */
export const WithFloodRiskBadge = ({
  level,
  children,
}: {
  level: FloodRiskLevel | null;
  children: React.ReactNode;
}) => {
  if (!level || level === FloodRiskLevel.Low) {
    return <>{children}</>;
  }
  return (
    <View style={$overlayContainer}>
      {children}
      <View style={$overlayBadge}>
        <FloodRiskBadge level={level} variant="overlay" />
      </View>
    </View>
  );
};

const $overlayContainer: ViewStyle = {
  position: "relative",
};

const $overlayBadge: ViewStyle = {
  position: "absolute",
  top: -8,
  right: -8,
};

export default FloodRiskBadge;
