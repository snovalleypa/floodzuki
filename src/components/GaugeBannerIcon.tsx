import React, { useState } from "react";
import { Image } from "expo-image";
import { Gage } from "../models/Gage";
import { isWeb } from "@common-ui/utils/responsive";
import { StyleSheet, Pressable } from "react-native";
import { BannerTypes, RegionBanners } from "../models/Banners";
import { Cell } from "../common-ui/components/Common";
import { Spacing } from "../common-ui/constants/spacing";
import Tooltip from "react-native-walkthrough-tooltip";
import { MediumText } from "../common-ui/components/Text";
import { Card } from "../common-ui/components/Card";
import { ColorTypes } from "../common-ui/constants/colors";

const styles = StyleSheet.create({
  webBannerIcon: {
    width: 24,
    height: 24,
  },
  mobileBannerIcon: {
    width: 24,
    height: 24,
  },
  touchable: {},
});

export const GAUGE_BANNER_ICONS = {
  info: require("@assets/images/alert-info.svg"),
  warning: require("@assets/images/alert-medium.svg"),
  danger: require("@assets/images/alert-high.svg"),
};

const getGaugeBannerIconKey = (gauge: Gage, bannerType: string): string | null => {
  switch (bannerType.toLowerCase()) {
    default:
    case BannerTypes.info:
      return "info";
    case BannerTypes.warning:
      return "warning";
    case BannerTypes.danger:
      return "danger";
  }
};

const GaugeBannerIcon = ({
  gauge,
  regionBanners,
  showPopup,
  leftSpacing,
  rightSpacing,
}: {
  gauge: Gage;
  regionBanners?: RegionBanners;
  showPopup: boolean;
  leftSpacing: boolean;
  rightSpacing: boolean;
}) => {
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const gaugeBanners = regionBanners?.gaugeBanners.get(gauge.locationId);
  if (!gaugeBanners) {
    return null;
  }
  const { bannerType, banner } = gaugeBanners;
  if (!bannerType || !banner) {
    return null;
  }

  const leftSpacingWidth = leftSpacing ? Spacing.medium : 0;
  const rightSpacingWidth = rightSpacing ? Spacing.medium : 0;

  const iconKey = getGaugeBannerIconKey(gauge, bannerType);
  if (!iconKey) {
    return null;
  }
  const icon = GAUGE_BANNER_ICONS[iconKey];
  const iconCtrl = isWeb ? (
    <Cell testID="gauge-banner-icon" left={leftSpacingWidth} right={rightSpacingWidth}>
      <img src={icon} style={styles.webBannerIcon} />
    </Cell>
  ) : (
    <Image testID="gauge-banner-icon" source={icon} style={styles.mobileBannerIcon} />
  );

  if (showPopup) {
    let cardType: ColorTypes | "default" = "default";
    switch (bannerType.toLowerCase()) {
      default:
      case BannerTypes.info:
        break;
      case BannerTypes.warning:
        cardType = ColorTypes.warning;
        break;
      case BannerTypes.danger:
        cardType = ColorTypes.danger;
        break;
    }

    return (
      <Cell left={Spacing.tiny}>
        <Tooltip
          contentStyle={{ backgroundColor: "transparent", paddingBottom: 20 }}
          isVisible={tooltipVisible}
          disableShadow={true}
          content={
            <Card type={cardType} borderColor="black" testID="gauge-banner-popup">
              <MediumText>{banner}</MediumText>
            </Card>
          }
          placement="top"
          onClose={() => {
            setTooltipVisible(false);
          }}>
          <Pressable
            style={styles.touchable}
            onPress={(e) => {
              e?.preventDefault();
              setTooltipVisible(!tooltipVisible);
            }}>
            {iconCtrl}
          </Pressable>
        </Tooltip>
      </Cell>
    );
  } else {
    return iconCtrl;
  }
};

export default GaugeBannerIcon;
