import React from "react"
import { observer } from "mobx-react-lite";

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
    return '(road saddle level)';
  }
  return '(' + Math.abs(diff).toFixed(1) + ' ft ' + (diff > 0 ? "below" : "above") + ' road saddle)'
}

const StatusLevelsCard = observer(
  function StatusLevelsCard({ gage }: { gage: Gage }) {
    const handleManageLinkPress = () => {
      
    }

    // TODO: Fix this once the subscription is working
    let manageText = "Log in to get Alerts when status changes"
    // If logged in, show "Get Alerts when status changes" instead
    // manageText = "Log in to get Alerts when status changes"
    // If subscribed, show "Manage Alerts" instead
    // manageText = "Manage Alerts"

    return (
      <Card flex>  
        <CardHeader>
          <SmallTitle>Status Levels</SmallTitle>
        </CardHeader>
        <Cell flex>
          <CardItem>
            <LargeLabel type="success" text="Normal" />
            <RegularText>Below {formatHeight(gage.yellowStage ?? gage.redStage)}</RegularText>
          </CardItem>
          <CardItem>
            <LargeLabel type="warning" text="Near Flooding" />
            <RegularText>
              At and above {formatHeight(gage.yellowStage)}{"\n"}
              <If condition={!!gage.roadSaddleHeight}>
                <SmallText>{formatToRoadText(gage.roadToYellowStage)}</SmallText>
              </If>
            </RegularText>
          </CardItem>
          <CardItem noBorder>
            <LargeLabel type="danger" text="Flooding" />
            <RegularText>
              At and above {formatHeight(gage.redStage)}{"\n"}
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
