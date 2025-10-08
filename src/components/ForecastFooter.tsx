import React from "react"

import { SimpleLinkButton } from "@common-ui/components/Button"
import { Cell, Separator } from "@common-ui/components/Common"
import { RegularText } from "@common-ui/components/Text"
import { Spacing } from "@common-ui/constants/spacing"

import { openLinkInBrowser } from "@utils/navigation"
import Config from "@config/config"
import { useLocale } from "@common-ui/contexts/LocaleContext"

const ForecastFooter = () => {
  const { t } = useLocale()
  
  const openNoaaSite = () => {
    openLinkInBrowser(Config.NOAA_URL)
  }

  return (
    <Cell vertical={Spacing.large}>
      <Separator />
      <Cell vertical={Spacing.large} align="center">
        <Cell bottom={Spacing.extraSmall}>
          <RegularText>{t("forecastScreen.dataSuppliedBy")}</RegularText>
        </Cell>
        <SimpleLinkButton
          text={t("forecastScreen.noaaTitle")}
          onPress={openNoaaSite}
        />
      </Cell>
      <Separator />
    </Cell>
  )
}

export default ForecastFooter
