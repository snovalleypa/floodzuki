import React from "react"
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";

import { Card, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { LabelText, MediumText, RegularText, SmallTitle } from "@common-ui/components/Text";

import { Gage, STATUSES } from "@models/Gage";
import localDayJs from "@services/localDayJs";
import { If } from "@common-ui/components/Conditional";
import { useStores } from "@models/helpers/useStores";
import { formatReadingTime } from "@utils/useTimeFormat";
import { formatFlow, formatHeight, formatTrend, isNullish } from "@utils/utils";
import { LargeLabel } from "@common-ui/components/Label";
import TrendIcon, { levelTrendIconName } from "@components/TrendIcon";
import { Spacing } from "@common-ui/constants/spacing";
import { t } from "@i18n/translate";

const CalloutReading = observer(
  function CalloutReadingCard({ gage }: { gage: Gage }) {
    const { gagesStore } = useStores()
    const { from, to } = useLocalSearchParams()

    const isNow = !!from && !!to ? to === localDayJs().format("YYYY-MM-DD") : true
    
    const status = isNow ? gage.status : gage.peakStatus
    const reading = status?.lastReading
    const label = isNow ? t("calloutReading.lastReading") : t("calloutReading.peak")

    const roadStatus = gage?.getCalculatedRoadStatus(gage?.waterLevel)

    const timeAgo = isNow && reading?.timestamp ? localDayJs.tz(reading?.timestamp).fromNow() : null

    const hasTrendInfo = !!status?.levelTrend && !!status?.waterTrend && !isNullish(status?.waterTrend?.trendValue)
    const hasRoadInfo = !isNullish(gage?.roadSaddleHeight) && !!gage?.roadDisplayName
    
    return (
      <Card flex>  
        <CardHeader>
          <Row align="space-between" justify="flex-start">
            <SmallTitle>{label}</SmallTitle>
            <If condition={gagesStore.isFetching}>
              <ActivityIndicator />
            </If>
          </Row>
          <LabelText>
            <If condition={!!timeAgo}>
              {timeAgo}{" / "}
            </If>
            {formatReadingTime(reading?.timestamp)}
          </LabelText>
        </CardHeader>
        <Cell flex>
          <If condition={!isNullish(reading?.waterHeight)}>
            <CardItem>
              <RegularText>{t("calloutReading.waterLevel")}</RegularText>
              <MediumText>{formatHeight(reading?.waterHeight)}</MediumText>
            </CardItem>
          </If>
          <If condition={!isNullish(reading?.waterDischarge)}>
            <CardItem>
              <RegularText>{t("calloutReading.waterFlow")}</RegularText>
              <MediumText>{formatFlow(reading?.waterDischarge)}</MediumText>
            </CardItem>
          </If>
          <CardItem noBorder={!hasRoadInfo && !hasTrendInfo}>
            <RegularText>{t("calloutReading.status")}</RegularText>
            <LargeLabel
              type={STATUSES[status?.floodLevel]}
              text={status?.floodLevel} />
          </CardItem>
          <If condition={hasTrendInfo}>
            <CardItem noBorder={!hasRoadInfo}>
              <RegularText>{t("calloutReading.trend")}</RegularText>
              <Row>
                <MediumText>{formatTrend(status?.waterTrend?.trendValue)}</MediumText>
                <Cell left={Spacing.tiny}>
                  <TrendIcon iconName={levelTrendIconName(status?.levelTrend)} />
                </Cell>
              </Row>
            </CardItem>
          </If>
          <If condition={hasRoadInfo}>
            <CardItem noBorder>
              <RegularText>{t("calloutReading.road")}</RegularText>
              <MediumText>
                {roadStatus?.deltaFormatted}{" "}
                {roadStatus?.preposition}{t("calloutReading.roadSmall")}
              </MediumText>
            </CardItem>
          </If>
        </Cell>
      </Card>
    )
  }
)

export default CalloutReading
