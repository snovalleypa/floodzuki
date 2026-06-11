import React from "react";
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
import { useUtils, isNullish } from "@utils/utils";
import { LargeLabel } from "@common-ui/components/Label";
import TrendIcon, { TREND_ICON_TYPES } from "@components/TrendIcon";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useFloodProbability } from "@utils/useFloodProbability";

const CalloutReading = observer(function CalloutReadingCard({ gage }: { gage: Gage }) {
  const { gagesStore, getTimezone } = useStores();
  const tz = getTimezone();
  const { t } = useLocale();
  const { from, to } = useLocalSearchParams();

  const { formatFlow, formatHeight, formatTrend } = useUtils();

  const isNow = !!from && !!to ? to === localDayJs().tz(tz).format("YYYY-MM-DD") : true;

  const status = isNow ? gage?.status : gage?.peakStatus;
  const reading = status?.lastReading;
  const label = isNow ? t("calloutReading.lastReading") : t("calloutReading.peak");

  const roadStatus = gage?.getCalculatedRoadStatus(gage?.waterLevel);

  const timeAgo =
    isNow && reading?.timestamp
      ? localDayJs.tz(reading.timestamp, "YYYY-MM-DDTHH:mm:ss", tz).fromNow()
      : null;

  const hasTrendInfo =
    !!status?.levelTrend && !!status?.waterTrend && !isNullish(status?.waterTrend?.trendValue);
  const hasRoadInfo = !isNullish(gage?.roadSaddleHeight) && !!gage?.roadDisplayName;

  // Forward-looking flood probability for the current reading only (not historic
  // peaks). Hidden when the gauge isn't covered by the prediction constants, or
  // when the gauge is already at/above red stage (it's flooding now, so a
  // "chance of flooding" is moot) — in which case we skip the calculation too.
  const isAtOrAboveRedStage =
    !isNullish(reading?.waterHeight) &&
    !isNullish(gage?.redStage) &&
    reading.waterHeight >= gage.redStage;
  const shouldPredictFlood = isNow && !isAtOrAboveRedStage;
  const { result: floodResult } = useFloodProbability(
    shouldPredictFlood ? gage?.locationId : undefined
  );
  const showFloodChance = shouldPredictFlood && !!floodResult;
  // Probability is clamped to [0.1, 0.9]; the bounds carry "<10%" / ">90%"
  // labels since the data can't assert beyond them.
  const floodChancePercent = Math.round(((floodResult?.probability ?? 0) * 100) / 5) * 5;
  let floodChanceLabel = `${floodChancePercent}%`;
  if (floodResult?.isLow) {
    floodChanceLabel = t("calloutReading.floodChanceLow");
  } else if (floodChancePercent >= 90) {
    floodChanceLabel = t("calloutReading.floodChanceVeryHigh");
  }

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
            {timeAgo}
            {" / "}
          </If>
          {formatReadingTime(reading?.timestamp, tz)}
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
        <If condition={showFloodChance}>
          <CardItem>
            <RegularText>
              {t("calloutReading.floodChance", { days: floodResult?.windowDays })}
            </RegularText>
            <MediumText>{floodChanceLabel}</MediumText>
          </CardItem>
        </If>
        <CardItem noBorder={!hasRoadInfo && !hasTrendInfo}>
          <RegularText>{t("calloutReading.status")}</RegularText>
          <LargeLabel type={STATUSES[status?.floodLevel]} text={status?.floodLevel} />
        </CardItem>
        <If condition={hasTrendInfo}>
          <CardItem noBorder={!hasRoadInfo}>
            <RegularText>{t("calloutReading.trend")}</RegularText>
            <Row>
              <MediumText>{formatTrend(status?.waterTrend?.trendValue)}</MediumText>
              <Cell left={Spacing.tiny}>
                <TrendIcon gage={gage} iconType={TREND_ICON_TYPES.Trend} />
              </Cell>
            </Row>
          </CardItem>
        </If>
        <If condition={hasRoadInfo}>
          <CardItem noBorder>
            <RegularText>{t("calloutReading.road")}</RegularText>
            <MediumText>
              {roadStatus?.delta?.toFixed(1)} {t("measure.ft")}{" "}
              {roadStatus && t(`${roadStatus.preposition}`)}
              {t("calloutReading.roadSmall")}
            </MediumText>
          </CardItem>
        </If>
      </Cell>
    </Card>
  );
});

export default CalloutReading;
