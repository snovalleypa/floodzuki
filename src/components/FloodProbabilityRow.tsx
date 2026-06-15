import React from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";

import { Gage } from "@models/Gage";
import { ROUTES } from "app/_layout";
import { Cell, Row } from "@common-ui/components/Common";
import { MediumText, RegularText, SmallerText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useFloodProbability } from "@utils/useFloodProbability";
import { isAtOrAboveThreshold } from "@utils/useFloodRiskLevel";
import { formatFloodChanceLabel } from "@utils/floodChanceLabel";
import { floodChanceRiskLevel } from "@services/floodPrediction/calculations";
import { FloodRiskLevel } from "@services/floodPrediction/types";
import FloodRiskBadge from "@components/FloodRiskBadge";

interface Props {
  gage: Gage;
  /** Display threshold (gauge stage units): road saddle or red stage. Used for the
   * "already flooding" check. */
  threshold: number;
  /** Threshold passed to the probability hook. `undefined` means the gauge's own
   * red stage (reuses the warmed default cache and matches the details card);
   * a value (road saddle) shifts the computation. */
  thresholdOverride?: number;
  /** Primary (leading) label — road name for road rows, gauge name otherwise. */
  primary: string;
  /** Optional subheader — gauge name for road rows. */
  sub?: string;
}

/**
 * One gauge row inside a Forecast flood-probability card. Renders the leading
 * label, optional subheader, the 10-day combined flood chance (or "Flooding now"
 * when already at/above the threshold), and the inline Medium+ risk badge. Each
 * row is its own observer so its async probability resolves independently.
 */
const FloodProbabilityRow = observer(function FloodProbabilityRow({
  gage,
  threshold,
  thresholdOverride,
  primary,
  sub,
}: Props) {
  const { t } = useLocale();

  const flooding = isAtOrAboveThreshold(gage?.lastReading?.waterHeight, threshold);
  // Skip the forward-looking calc when it's already flooding for this threshold.
  const chanceResult = useFloodProbability(flooding ? undefined : gage, thresholdOverride);

  const chance = chanceResult?.chance;
  const riskLevel = chance ? floodChanceRiskLevel(chance) : null;
  const badge = riskLevel && riskLevel !== FloodRiskLevel.Low ? riskLevel : null;

  // The value cell: "Flooding now" when already over the threshold, otherwise the
  // resolved chance label, otherwise a spinner while the async forecast lands.
  let valueNode: React.ReactNode;
  if (flooding) {
    valueNode = <RegularText color={Colors.red}>{t("forecastScreen.floodingNow")}</RegularText>;
  } else if (chance) {
    valueNode = (
      <MediumText color={chance.level === "low" ? Colors.midGrey : Colors.lightDark}>
        {formatFloodChanceLabel(chance, t)}
      </MediumText>
    );
  } else {
    valueNode = <ActivityIndicator size="small" />;
  }

  return (
    <Link href={{ pathname: ROUTES.GageDetails, params: { id: gage.locationId } }} asChild>
      <Pressable>
        <Row align="space-between" justify="flex-start" vertical={Spacing.small}>
          <Cell flex>
            <MediumText color={Colors.lightDark}>{primary}</MediumText>
            {!!sub && <SmallerText muted>{sub}</SmallerText>}
          </Cell>
          <Row>
            {valueNode}
            {!!badge && (
              <Cell left={Spacing.tiny}>
                <FloodRiskBadge level={badge} variant="inline" />
              </Cell>
            )}
          </Row>
        </Row>
      </Pressable>
    </Link>
  );
});

export default FloodProbabilityRow;
