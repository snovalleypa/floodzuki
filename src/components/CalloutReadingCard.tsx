import React from "react";
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";

import { Card, CardHeader, CardItem } from "@common-ui/components/Card";
import { Cell, Row, Separator } from "@common-ui/components/Common";
import {
  LabelText,
  MediumText,
  RegularText,
  SmallerText,
  SmallTitle,
} from "@common-ui/components/Text";

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
import { deriveRange } from "@utils/deriveRange";
import { normalizeSearchParams } from "@utils/navigation";
import { computeThresholdCrossing } from "@utils/thresholdCrossing";
import { Fonts } from "@common-ui/constants/typography";

const CalloutReading = observer(function CalloutReadingCard({ gage }: { gage: Gage }) {
  const { gagesStore, getTimezone } = useStores();
  const tz = getTimezone();
  const { t } = useLocale();
  const { from, to } = useLocalSearchParams();

  const { formatFlow, formatHeight, formatTrend } = useUtils();

  // Use the same range derivation as the chart so the card agrees on live vs
  // historic. The ad-hoc check this replaced didn't recognize the `to="now"`
  // live literal or relative `from="-N"`, so the live shortcuts (and the "live"
  // button from a historic view) wrongly showed Peak instead of Latest Reading.
  const { isNow } = deriveRange(normalizeSearchParams(from), normalizeSearchParams(to), tz);

  const status = isNow ? gage?.status : gage?.peakStatus;
  const reading = status?.lastReading;
  const label = isNow ? t("calloutReading.lastReading") : t("calloutReading.peak");

  // Road / flood-level delta must reflect the reading this card is showing — the
  // peak height for a historic range, the live level when "now" — not always the
  // live level.
  const roadStatus = gage?.getCalculatedRoadStatus(reading?.waterHeight);
  const floodStatus = gage?.getCalculatedFloodStatus(reading?.waterHeight);

  // Predicted time the live trend crosses the road saddle / flood level. Only
  // present in live mode (predictions are the live nowcast); shown under the
  // Trend row.
  const crossing = computeThresholdCrossing(gage, tz);

  const timeAgo =
    isNow && reading?.timestamp
      ? localDayJs.tz(reading.timestamp, "YYYY-MM-DDTHH:mm:ss", tz).fromNow()
      : null;

  const hasTrendInfo =
    !!status?.levelTrend && !!status?.waterTrend && !isNullish(status?.waterTrend?.trendValue);
  const hasRoadInfo = !isNullish(gage?.roadSaddleHeight) && !!gage?.roadDisplayName;
  // Gauges without a road fall back to a "Flood Level" row (relative to red stage).
  const hasFloodLevelInfo = !hasRoadInfo && !isNullish(gage?.redStage);
  const hasRoadOrFlood = hasRoadInfo || hasFloodLevelInfo;

  // Forward-looking flood probability for the current reading only (not historic
  // peaks). Hidden when the gauge isn't covered by the prediction constants, or
  // when the gauge is already at/above red stage (it's flooding now, so a
  // "chance of flooding" is moot) — in which case we skip the calculation too.
  const isAtOrAboveRedStage =
    !isNullish(reading?.waterHeight) &&
    !isNullish(gage?.redStage) &&
    reading.waterHeight >= gage.redStage;
  const shouldPredictFlood = isNow && !isAtOrAboveRedStage;
  const floodChance = useFloodProbability(shouldPredictFlood ? gage : undefined);
  const showFloodChance = !!floodChance;

  // Map the combined chance bucket to a label. Forecast tops out at 90% (a lower
  // bound → ">90%"); the observed path is precise (exact 90/95, ">=99%").
  const chance = floodChance?.chance;
  let floodChanceLabel = "";
  if (chance?.level === "low") {
    floodChanceLabel = t("calloutReading.floodChanceLow");
  } else if (chance?.level === "percent") {
    floodChanceLabel = `${chance.percent}%`;
  } else if (chance?.level === "veryHighClamp") {
    floodChanceLabel = t("calloutReading.floodChanceVeryHigh");
  } else if (chance?.level === "veryHigh") {
    floodChanceLabel = t("calloutReading.floodChanceVeryHighExact", { percent: chance.percent });
  } else if (chance?.level === "nearCertain") {
    floodChanceLabel = t("calloutReading.floodChanceNearCertain");
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
              {t("calloutReading.floodChance", { days: floodChance?.windowDays })}
            </RegularText>
            <MediumText>{floodChanceLabel}</MediumText>
          </CardItem>
        </If>
        <CardItem noBorder={!hasRoadOrFlood && !hasTrendInfo}>
          <RegularText>{t("calloutReading.status")}</RegularText>
          <LargeLabel type={STATUSES[status?.floodLevel]} text={status?.floodLevel} />
        </CardItem>
        <If condition={hasTrendInfo}>
          {/* Custom (non-CardItem) layout: the optional crossing line spans both
              columns, centered, below the label/value row. */}
          <Cell horizontal={-Spacing.small}>
            <Cell horizontal={Spacing.small} vertical={Spacing.small}>
              <Row align="space-between">
                <RegularText>{t("calloutReading.trend")}</RegularText>
                <Row>
                  <MediumText>{formatTrend(status?.waterTrend?.trendValue)}</MediumText>
                  <Cell left={Spacing.tiny}>
                    <TrendIcon gage={gage} iconType={TREND_ICON_TYPES.Trend} />
                  </Cell>
                </Row>
              </Row>
              <If condition={!!crossing}>
                <Cell top={Spacing.tiny} align="center">
                  <SmallerText muted align="center">
                    {crossing?.kind === "road"
                      ? t("calloutReading.trendIntersectsRoad")
                      : t("calloutReading.trendIntersectsFlood")}{" "}
                    <SmallerText
                      textStyle={[{ fontFamily: Fonts.openSans.bold, fontWeight: "700" }]}>
                      {crossing?.time.format("llll")}
                    </SmallerText>
                  </SmallerText>
                </Cell>
              </If>
            </Cell>
            <If condition={hasRoadOrFlood}>
              <Separator />
            </If>
          </Cell>
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
        <If condition={hasFloodLevelInfo}>
          <CardItem noBorder>
            <RegularText>{t("calloutReading.floodLevel")}</RegularText>
            <MediumText>
              {floodStatus?.delta?.toFixed(1)} {t("measure.ft")}{" "}
              {floodStatus && t(`${floodStatus.preposition}`)}
              {t("calloutReading.floodLevelSmall")}
            </MediumText>
          </CardItem>
        </If>
      </Cell>
    </Card>
  );
});

export default CalloutReading;
