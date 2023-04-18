import React from "react"
import { observer } from "mobx-react-lite";
import { t } from "@i18n/translate";

import { LinkButton } from "@common-ui/components/Button";
import { Card, CardFooter, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import { LargeLabel } from "@common-ui/components/Label";
import { RegularText, SmallText, SmallTitle } from "@common-ui/components/Text";
import { Gage } from "@models/Gage";
import { formatHeight } from "@utils/utils";

const formatToRoadText = (diff) => {
  if (Math.abs(diff) <.1) {
    return `(${t("statusLevelsCard.roadSaddle")} ${t("statusLevelsCard.level")})`;
  }
  return `(${Math.abs(diff).toFixed(1)} ${t("measure.ft")} ${(diff > 0 ? t("statusLevelsCard.below") : t("statusLevelsCard.above"))} ${t("statusLevelsCard.roadSaddle")})`
}

const StatusLevelsCard = observer(
  function StatusLevelsCard({ gage }: { gage: Gage }) {
    const handleManageLinkPress = () => {
      
    }

    // TODO: Fix this once the subscription is working
    let manageText = t("statusLevelsCard.logInToGetAlerts")
    // If logged in, show "Get Alerts when status changes" instead
    // manageText = t("statusLevelsCard.getAlerts")
    // If subscribed, show "Manage Alerts" instead
    // manageText = t("statusLevelsCard.manageAlerts")

    return (
      <Card flex>  
        <CardHeader>
          <SmallTitle>{t("statusLevelsCard.statusLevels")}</SmallTitle>
        </CardHeader>
        <Cell flex>
          <CardItem>
            <LargeLabel type="success" text={t("status.normal")} />
            <RegularText>{t("statusLevelsCard.Below")} {formatHeight(gage.yellowStage ?? gage.redStage)}</RegularText>
          </CardItem>
          <CardItem>
            <LargeLabel type="warning" text={t("status.nearFlooding")} />
            <RegularText>
              {t("statusLevelsCard.atAndAbove")} {formatHeight(gage.yellowStage)}{"\n"}
              <If condition={!!gage.roadSaddleHeight}>
                <SmallText>{formatToRoadText(gage.roadToYellowStage)}</SmallText>
              </If>
            </RegularText>
          </CardItem>
          <CardItem noBorder>
            <LargeLabel type="danger" text={t("status.flooding")} />
            <RegularText>
              {t("statusLevelsCard.atAndAbove")} {formatHeight(gage.redStage)}{"\n"}
              <If condition={!!gage.roadSaddleHeight}>
                <SmallText>{formatToRoadText(gage.roadToRedStage)}</SmallText>
              </If>
            </RegularText>
          </CardItem>
          <CardFooter>
            <Cell flex align="center">
              <LinkButton
                selfAlign="center"
                title={manageText}
                onPress={handleManageLinkPress}
              />
            </Cell>
          </CardFooter>
        </Cell>
      </Card>
    )
  }
)

export default StatusLevelsCard
