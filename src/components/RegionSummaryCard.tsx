import React from "react";
import { Switch } from "react-native";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";

import { Card } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
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
  const statusColor =
    counts.flooding > 0 ? Colors.danger : counts.nearFlooding > 0 ? Colors.warning : Colors.success;

  const severity = forecastsStore.severity as "none" | "near" | "flood";
  const forecastCopy =
    severity === "flood"
      ? t("regionSummary.floodingPredicted")
      : severity === "near"
      ? t("regionSummary.nearFloodPredicted")
      : t("regionSummary.noFloodingPredicted");
  const forecastColor =
    severity === "flood" ? Colors.danger : severity === "near" ? Colors.warning : Colors.success;
  const forecastBg =
    severity === "flood"
      ? Colors.softRed
      : severity === "near"
      ? Colors.softYellow
      : Colors.softGreen;

  const ForecastPill = (
    <Link href={ROUTES.Forecast} asChild>
      <Cell
        bgColor={forecastBg}
        innerHorizontal={Spacing.small}
        innerVertical={Spacing.tiny}
        top={Spacing.small}
        style={{ borderLeftWidth: 3, borderLeftColor: forecastColor, borderRadius: 4 }}>
        <SmallerText color={forecastColor}>{forecastCopy}</SmallerText>
      </Cell>
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
            <SmallerText color={Colors.lightDark}>{counts.visibleOffline}</SmallerText>{" "}
            {t("regionSummary.offline")}
          </SmallerText>
          <SmallerText>
            <SmallerText color={Colors.lightDark}>{counts.hidden}</SmallerText>{" "}
            {t("regionSummary.hidden")}
          </SmallerText>
          <Row top={Spacing.tiny} align="flex-end">
            <LabelText>{t("regionSummary.showHidden")}</LabelText>
            <Cell left={Spacing.tiny}>
              <Switch
                testID="region-summary-toggle"
                value={showHiddenOffline}
                disabled={counts.hidden === 0}
                onValueChange={setShowHiddenOffline}
              />
            </Cell>
          </Row>
        </Cell>
      </RowOrCell>
    </Card>
  );
});

export default RegionSummaryCard;
