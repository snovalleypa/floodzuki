import React from "react"
import { Image } from "expo-image"

import { Cell, Row, RowOrCell, Separator } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"
import { RegularLargeText, RegularText } from "@common-ui/components/Text"
import { SimpleLinkButton } from "@common-ui/components/Button"

import { useAppAssets } from "@common-ui/contexts/AssetsContext"
import { isWeb, useResponsive } from "@common-ui/utils/responsive"
import { openLinkInBrowser } from "@utils/navigation"
import Config from "@config/config"
import { useRouter } from "expo-router"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { useLocale } from "@common-ui/contexts/LocaleContext"
import LocaleChange from "./LocaleChange"

const WebFooter = () => {
  const { t } = useLocale()
  const { isMobile } = useResponsive()
  const { getAsset } = useAppAssets()
  const router = useRouter()

  if (!isWeb) return null

  const openSvpaWebsite = () => {
    openLinkInBrowser(Config.SVPA_URL)
  }

  const openPrivacyPolicy = () => {
    router.push({ pathname: ROUTES.Privacy })
  }

  const openTermsOfService = () => {
    router.push({ pathname: ROUTES.Terms })
  }

  const makeAPhoneCall = () => {
    openLinkInBrowser(`tel:${Config.SVPA_PHONE}`)
  }

  const sendAnEmail = () => {
    openLinkInBrowser(`mailto:${Config.SVPA_EMAIL}`)
  }

  const Text = isMobile ? RegularText : RegularLargeText
  const imageSize = isMobile ? 100 : 156
  const leftMargin = isMobile ? 0 : 150
  const horizontalOffset = isMobile ? Spacing.medium : Spacing.large
  const separator = "  |  "

  return (
    <Cell
      bgColor={Colors.white}
      top={Spacing.larger}
      innerVertical={Spacing.large}
      innerHorizontal={horizontalOffset}
    >
      <RowOrCell justify="flex-start">
        <Text
          color={Colors.darkerGrey}
          textStyle={[{ lineHeight: Spacing.midLarge }]}
          align="justify"
        >
          {t("footer.description1")}
          <SimpleLinkButton
            text={t("footer.svpaTitle")}
            onPress={openSvpaWebsite}
          />
          {t("footer.description2")}
        </Text>
        <Cell
          left={leftMargin}
          right={Spacing.medium}
          vertical={Spacing.large}
          align="center">
          <Image
            source={getAsset("svpaLogo")}
            style={{ width: imageSize, height: imageSize }}
          />
        </Cell>
      </RowOrCell>
      <Separator />
      <Row top={Spacing.large}>
        <Text
          textStyle={[{ lineHeight: Spacing.midLarge }]}
          color={Colors.darkerGrey}
        >
          <LocaleChange />
          {separator}
          <SimpleLinkButton
            text={t("navigation.aboutScreen")}
            onPress={openSvpaWebsite}
          />
          {separator}
          <SimpleLinkButton
            text={t("navigation.privacyPolicyScreen")}
            onPress={openPrivacyPolicy}
          />
          {separator}
          <SimpleLinkButton
            text={t("navigation.termsOfServiceScreen")}
            onPress={openTermsOfService}
          />
          {separator}
          <SimpleLinkButton
            text={Config.SVPA_PHONE}
            onPress={makeAPhoneCall}
          />
          {separator}
          <SimpleLinkButton
            text={Config.SVPA_EMAIL}
            onPress={sendAnEmail}
          />
        </Text>
      </Row>
      <Cell top={Spacing.large}>
        <Text
          textStyle={[{ lineHeight: Spacing.midLarge }]}
          color={Colors.darkerGrey}
        >
          {t("footer.addressLine1")}: 4621 Tolt Avenue, Carnation, WA 98014{"\n"}
          {t("footer.addressLine2")}: P.O. Box 1148, Carnation, WA 98014{"\n"}
          {t("footer.copyright")}
        </Text>
      </Cell>
    </Cell>
  )
}

export default WebFooter
