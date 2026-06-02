import React from "react";
import { Switch, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";

import { Cell, Row } from "@common-ui/components/Common";
import { LARGE_LABEL_COLORS } from "@common-ui/components/Label";
import { SmallerText, SmallTitle } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useStores } from "@models/helpers/useStores";
import { ForecastSeverity } from "@models/helpers/regionSummary";
import { ROUTES } from "app/_layout";

const RegionSummaryCard = observer(function RegionSummaryCard() {
  const { t } = useLocale();
  const { showHiddenOffline, setShowHiddenOffline, getBucketCounts, forecastsStore } = useStores();

  const counts = getBucketCounts();

  const statusParts: string[] = [];
  if (counts.flooding > 0) {
    statusParts.push(t("regionSummary.flooding", { count: counts.flooding }));
  }
  if (counts.nearFlooding > 0) {
    statusParts.push(t("regionSummary.nearFlooding", { count: counts.nearFlooding }));
  }
  const statusText =
    statusParts.length === 0 ? t("regionSummary.allNormal") : statusParts.join(" · ");
  const statusLabelType =
    counts.flooding > 0 ? "danger" : counts.nearFlooding > 0 ? "warning" : "success";
  const statusColor = LARGE_LABEL_COLORS[statusLabelType].textColor;

  const severity = forecastsStore.severity as ForecastSeverity;
  const forecastLabelType =
    severity === ForecastSeverity.Flood
      ? "danger"
      : severity === ForecastSeverity.Near
      ? "warning"
      : "success";
  const forecastCopy =
    severity === ForecastSeverity.Flood
      ? t("regionSummary.floodingPredicted")
      : severity === ForecastSeverity.Near
      ? t("regionSummary.nearFloodPredicted")
      : t("regionSummary.noFloodingPredicted");
  const forecastColor = LARGE_LABEL_COLORS[forecastLabelType].textColor;
  const forecastBg = LARGE_LABEL_COLORS[forecastLabelType].backgroundColor;

  const ForecastPill = (
    <Link href={ROUTES.Forecast} asChild>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          borderLeftWidth: 3,
          borderLeftColor: forecastColor,
          borderRadius: 4,
        }}>
        <Cell
          bgColor={forecastBg}
          innerHorizontal={Spacing.small}
          innerVertical={Spacing.tiny}
          borderRadius={4}>
          <SmallerText color={forecastColor}>{forecastCopy}</SmallerText>
        </Cell>
      </TouchableOpacity>
    </Link>
  );

  return (
    <Cell
      bottom={Spacing.extraSmall}
      innerHorizontal={Spacing.medium}
      innerVertical={Spacing.extraSmall}>
      <Row justify="center" align="space-between">
        <Cell flex>
          <SmallTitle color={statusColor}>{statusText}</SmallTitle>
        </Cell>
        <Cell left={Spacing.medium} align="flex-end">
          {ForecastPill}
        </Cell>
      </Row>
      <Row top={Spacing.medium} align="space-between" justify="center" wrap>
        <Row>
          <SmallerText>
            <SmallerText color={Colors.lightDark}>{counts.active}</SmallerText>{" "}
            {t("regionSummary.active")}
            {", "}
            <SmallerText color={Colors.lightDark}>
              {counts.visibleOffline + counts.hidden}
            </SmallerText>{" "}
            {t("regionSummary.offline")}
            {counts.hidden > 0 && (
              <>
                {" ("}
                <SmallerText color={Colors.lightDark}>{counts.hidden}</SmallerText>{" "}
                {t("regionSummary.hidden")}
                {")"}
              </>
            )}
          </SmallerText>
        </Row>
        {counts.hidden > 0 && (
          <Row>
            <SmallerText>{t("regionSummary.showHidden")}</SmallerText>
            <Cell left={Spacing.tiny}>
              <Switch
                testID="region-summary-toggle"
                value={showHiddenOffline}
                onValueChange={setShowHiddenOffline}
                trackColor={{ false: Colors.lightGrey, true: Colors.primary }}
                thumbColor={Colors.white}
                ios_backgroundColor={Colors.lightGrey}
                // react-native-web extends Switch with activeThumbColor (the on-state
                // thumb color on web); the prop isn't in react-native's SwitchProps so
                // TS rejects it on native typings.
                // @ts-expect-error — web-only prop, see https://necolas.github.io/react-native-web/docs/switch/
                activeThumbColor={Colors.white}
              />
            </Cell>
          </Row>
        )}
      </Row>
    </Cell>
  );
});

export default RegionSummaryCard;
