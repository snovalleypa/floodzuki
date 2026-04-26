import React, { useState } from "react";
import { Image } from "expo-image";

import { Cell, Row, Separator } from "@common-ui/components/Common";
import { useResponsive } from "@common-ui/utils/responsive";
import { Spacing } from "@common-ui/constants/spacing";
import { MediumText, SmallText } from "@common-ui/components/Text";
import { useAppAssets } from "@common-ui/contexts/AssetsContext";
import { IconButton, SolidButton } from "@common-ui/components/Button";
import { openLinkInBrowser } from "@utils/navigation";
import { Colors } from "@common-ui/constants/colors";
import { useLocale } from "@common-ui/contexts/LocaleContext";

const STORAGE_KEY = "install_banner_dismissed_at";
const SUPPRESS_DAYS = 30;

export function isBannerSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = new Date(raw).getTime();
    if (isNaN(dismissedAt)) return false;
    const cutoff = Date.now() - SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
    return dismissedAt > cutoff;
  } catch {
    return false;
  }
}

const AppStoreBanner = () => {
  const { isMobile } = useResponsive();
  const { getAsset } = useAppAssets();
  const { t } = useLocale();

  const [isBannerVisible, setIsBannerVisible] = useState(() => !isBannerSuppressed());

  const openPlayMarket = () => {
    openLinkInBrowser("https://play.google.com/store/apps/details?id=com.floodzilla.floodzuki");
  };

  const openAppStore = () => {
    openLinkInBrowser("https://apps.apple.com/us/app/floodzilla/id6448645748");
  };

  const openBannerLink = () => {
    if (/Android/i.test(navigator?.userAgent)) {
      openPlayMarket();
    } else {
      openAppStore();
    }
  };

  const closeBanner = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setIsBannerVisible(false);
  };

  if (!isMobile || !isBannerVisible) {
    return null;
  }

  return (
    <Cell bgColor={Colors.softBlue}>
      <Row innerVertical={Spacing.small} innerHorizontal={Spacing.small}>
        <Cell right={Spacing.small}>
          <IconButton
            small
            icon="x"
            iconSize={Spacing.small}
            textColor={Colors.darkerGrey}
            backgroundColor={Colors.softBlue}
            onPress={closeBanner}
          />
        </Cell>
        <Cell right={Spacing.small}>
          <Image source={getAsset("logo")} style={{ width: 50, height: 50, borderRadius: 5 }} />
        </Cell>
        <Cell flex right={Spacing.small}>
          <MediumText>{t("common.appTitle")}</MediumText>
          <SmallText>{t("common.description")}</SmallText>
        </Cell>
        <Cell>
          <SolidButton
            small
            title={t("common.install")}
            onPress={openBannerLink}
            type="lightBlue"
          />
        </Cell>
      </Row>
      <Separator />
    </Cell>
  );
};

export default AppStoreBanner;
