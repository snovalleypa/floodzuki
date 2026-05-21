import React from "react";
import { Switch, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";

import { Card } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { LARGE_LABEL_COLORS } from "@common-ui/components/Label";
import { LabelText, SmallerText, SmallTitle } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useResponsive } from "@common-ui/utils/responsive";
import { useStores } from "@models/helpers/useStores";
import { ROUTES } from "app/_layout";

const RegionSummaryCard = observer(function RegionSummaryCard() {
  const { t } = useLocale();
  const { isMobile } = useResponsive();
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

  const severity = forecastsStore.severity as "none" | "near" | "flood";
  const forecastLabelType =
    severity === "flood" ? "danger" : severity === "near" ? "warning" : "success";
  const forecastCopy =
    severity === "flood"
      ? t("regionSummary.floodingPredicted")
      : severity === "near"
      ? t("regionSummary.nearFloodPredicted")
      : t("regionSummary.noFloodingPredicted");
  const forecastColor = LARGE_LABEL_COLORS[forecastLabelType].textColor;
  const forecastBg = LARGE_LABEL_COLORS[forecastLabelType].backgroundColor;

  const ForecastPill = (
    <Link href={ROUTES.Forecast} asChild>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          marginTop: Spacing.small,
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
    <Card bottom={Spacing.medium} innerHorizontal={Spacing.medium} innerVertical={Spacing.medium}>
      <RowOrCell flex justify="flex-start" align="space-between">
        <Cell flex>
          <SmallTitle color={statusColor}>{statusText}</SmallTitle>
          {ForecastPill}
        </Cell>
        <Cell
          left={isMobile ? 0 : Spacing.medium}
          top={isMobile ? Spacing.medium : 0}
          align={isMobile ? "flex-start" : "flex-end"}>
          <SmallerText>
            <SmallerText color={Colors.lightDark}>{counts.active}</SmallerText>{" "}
            {t("regionSummary.active")}
          </SmallerText>
          <SmallerText>
            <SmallerText color={Colors.lightDark}>
              {counts.visibleOffline + counts.hidden}
            </SmallerText>{" "}
            {t("regionSummary.offline")}
          </SmallerText>
          <SmallerText>
            <SmallerText color={Colors.lightDark}>{counts.hidden}</SmallerText>{" "}
            {t("regionSummary.hidden")}
          </SmallerText>
          <Row top={Spacing.tiny} align="flex-end">
            <SmallerText>{t("regionSummary.showHidden")}</SmallerText>
            <Cell left={Spacing.tiny}>
              <Switch
                testID="region-summary-toggle"
                value={showHiddenOffline}
                disabled={counts.hidden === 0}
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
        </Cell>
      </RowOrCell>
    </Card>
  );
});

export default RegionSummaryCard;
