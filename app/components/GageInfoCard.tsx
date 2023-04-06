import React from "react"
import { observer } from "mobx-react-lite";

import { LinkButton } from "@common-ui/components/Button";
import { Card, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import { MediumText, RegularText, SmallTitle } from "@common-ui/components/Text";
import { Gage } from "@models/Gage";
import { openLinkInBrowser } from "@utils/navigation";

const GageInfoCard = observer(
  function GageInfoCard({ gage }: { gage: Gage }) {
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
          <SmallTitle>Gage Info</SmallTitle>
        </CardHeader>
        <Cell flex>
          <CardItem>
            <RegularText>Gage ID</RegularText>
            <MediumText>{gage.locationId}</MediumText>
          </CardItem>
          <CardItem>
            <RegularText>Operated by</RegularText>
            <MediumText>{gage.opearatorName}</MediumText>
          </CardItem>
          <CardItem>
            <RegularText>River Mile</RegularText>
            <MediumText>{gage.riverMile}</MediumText>
          </CardItem>
          <If condition={!!gage.usgsInfo}>
            <CardItem>
              <RegularText>USGS Website</RegularText>
              <LinkButton
                align="right"
                title={`Gage ${gage.usgsInfo?.id}`}
                onPress={goToUSGSWebsite}
              />
            </CardItem>
          </If>
          <CardItem noBorder>
            <RegularText>Latitude,{"\n"}Longitude</RegularText>
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
