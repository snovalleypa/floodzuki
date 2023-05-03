import React from "react"
import { observer } from "mobx-react-lite";

import { LinkButton } from "@common-ui/components/Button";
import { Card, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import { MediumText, RegularText, SmallTitle } from "@common-ui/components/Text";
import { Gage } from "@models/Gage";
import { openLinkInBrowser } from "@utils/navigation";
import { useLocale } from "@common-ui/contexts/LocaleContext";

const GageInfoCard = observer(
  function GageInfoCard({ gage }: { gage: Gage }) {
    const { t } = useLocale()

    const goToUSGSWebsite = () => {
      if (!gage.usgsInfo) return
      
      const url = `https://waterdata.usgs.gov/monitoring-location/${gage.usgsInfo.id}`
      openLinkInBrowser(url)
    }

    const openLocationInMaps = () => {
      const url = `https://www.google.com/maps/search/?api=1&query=${gage.locationInfo?.latitude},${gage.locationInfo?.longitude}`
      openLinkInBrowser(url)
    }

    return (
      <Card flex>  
        <CardHeader>
          <SmallTitle>{t("gageInfoCard.gageInfo")}</SmallTitle>
        </CardHeader>
        <Cell flex>
          <CardItem>
            <RegularText>{t("gageInfoCard.gageID")}</RegularText>
            <MediumText>{gage.locationId}</MediumText>
          </CardItem>
          <CardItem>
            <RegularText>{t("gageInfoCard.operatedBy")}</RegularText>
            <MediumText>{gage.opearatorName}</MediumText>
          </CardItem>
          <CardItem>
            <RegularText>{t("gageInfoCard.riverMile")}</RegularText>
            <MediumText>{gage.riverMile}</MediumText>
          </CardItem>
          <If condition={!!gage.usgsInfo}>
            <CardItem>
              <RegularText>{t("gageInfoCard.usgsWebsite")}</RegularText>
              <LinkButton
                align="right"
                title={`${t("gageInfoCard.gage")} ${gage.usgsInfo?.id}`}
                onPress={goToUSGSWebsite}
              />
            </CardItem>
          </If>
          <CardItem noBorder>
            <RegularText>{`${t("gageInfoCard.latitude")},\n${t("gageInfoCard.longitude")}`}</RegularText>
            <LinkButton
              align="right"
              title={`${gage.locationInfo?.latitude?.toFixed(6)}, ${gage.locationInfo?.longitude?.toFixed(6)}`}
              onPress={openLocationInMaps}
            />
          </CardItem>
        </Cell>
      </Card>
    )
  }
)

export default GageInfoCard
