import React, { useState } from 'react';
import { Image } from 'expo-image';

import { Cell, Row, Separator } from '@common-ui/components/Common';
import { useResponsive } from '@common-ui/utils/responsive';
import { Spacing } from '@common-ui/constants/spacing';
import { MediumText, SmallText } from '@common-ui/components/Text';
import { useAppAssets } from '@common-ui/contexts/AssetsContext';
import { IconButton, SolidButton } from '@common-ui/components/Button';
import { openLinkInBrowser } from '@utils/navigation';
import { Colors } from '@common-ui/constants/colors';
import { useLocale } from '@common-ui/contexts/LocaleContext';

const TasteOfTheValleyBanner = () => {
  const { isMobile } = useResponsive();
  const { getAsset } = useAppAssets();
  const { t } = useLocale();

  const [isBannerVisible, setIsBannerVisible] = useState(true)

  const openPlayMarket = () => {
    openLinkInBrowser('https://play.google.com/store/apps/details?id=com.floodzilla.floodzuki')
  }

  const closeBanner = () => {
    setIsBannerVisible(false)
  }

  if (!isMobile || !isBannerVisible) {
    return null;
  }

  if (!/Android/i.test(navigator?.userAgent)) {
    return null;
  }

  return (
    <Cell bgColor={Colors.softBlue}>
      <Row innerVertical={Spacing.small} innerHorizontal={Spacing.small}>
        <Cell right={Spacing.small}>
          <IconButton
            small
            icon='x'
            iconSize={Spacing.small}
            textColor={Colors.darkerGrey}
            backgroundColor={Colors.softBlue}
            onPress={closeBanner}
          />
        </Cell>
        <Cell right={Spacing.small}>
          <Image
            source={getAsset('logo')}
            style={{ width: 50, height: 50, borderRadius: 5 }}
          />
        </Cell>
        <Cell flex right={Spacing.small}>
          <MediumText>{t("common.appTitle")}</MediumText>
          <SmallText>{t("common.description")}</SmallText>
        </Cell>
        <Cell>
          <SolidButton
            small
            title={t("common.install")}
            onPress={openPlayMarket}
            type='lightBlue'
          />
        </Cell>
      </Row>
      <Separator />
    </Cell>
  )
}

export default TasteOfTheValleyBanner
