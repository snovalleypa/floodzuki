import React from "react";
import { observer } from "mobx-react-lite";

import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import { Card, CardHeader } from "@common-ui/components/Card";
import { Cell, RowOrCell, Separator } from "@common-ui/components/Common";
import { LabelText, SmallTitle } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { useResponsive } from "@common-ui/utils/responsive";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { selectCardMembership } from "@utils/floodCardMembership";
import FloodProbabilityRow from "@components/FloodProbabilityRow";

interface FloodCardProps {
  title: string;
  subtitle: string;
  rows: Gage[];
  /** True on desktop/wide layout: the cards flex to share a row, side by side. */
  wide: boolean;
  /** First card in the layout — no inter-card gap before it. */
  first: boolean;
  renderRow: (gage: Gage) => React.ReactNode;
}

/** Shared card chrome (header + separated rows) for both flood-probability cards. */
const FloodCard = ({ title, subtitle, rows, wide, first, renderRow }: FloodCardProps) => {
  if (rows.length === 0) {
    return null;
  }
  // On wide screens the cards sit side by side (flex, left gap before the second);
  // stacked otherwise (top gap below the first). The chart gap above is provided
  // by the wrapping RowOrCell.
  const left = wide && !first ? Spacing.medium : 0;
  const top = !wide && !first ? Spacing.medium : 0;
  return (
    <Card flex={wide} left={left} top={top}>
      <CardHeader>
        <SmallTitle>{title}</SmallTitle>
        <LabelText>{subtitle}</LabelText>
      </CardHeader>
      <Cell>
        {rows.map((gage, i) => (
          <React.Fragment key={gage.locationId}>
            {i > 0 && <Separator />}
            {renderRow(gage)}
          </React.Fragment>
        ))}
      </Cell>
    </Card>
  );
};

/**
 * The two Forecast-tab flood-probability cards. Card 1 (Road Flooding) shows the
 * chance water reaches each gauge's road saddle; Card 2 (Flooding) shows the
 * chance it reaches red flood stage. Members and order come from
 * `selectCardMembership` over the river-ordered gauge list. On desktop the two
 * cards sit side by side; on mobile they stack.
 */
const FloodProbabilityCards = observer(function FloodProbabilityCards() {
  const { getAllLocationsWithGages } = useStores();
  const { t } = useLocale();
  const { isWideScreen } = useResponsive();

  const gages = getAllLocationsWithGages();
  const { roadRows, floodRows } = selectCardMembership(gages);

  return (
    <RowOrCell align="flex-start" justify="flex-start" top={Spacing.mediumXL}>
      <FloodCard
        title={t("forecastScreen.roadFloodingTitle")}
        subtitle={t("forecastScreen.roadFloodingSubtitle")}
        rows={roadRows}
        wide={isWideScreen}
        first
        renderRow={(gage) => (
          <FloodProbabilityRow
            gage={gage}
            threshold={gage.roadSaddleHeight as number}
            thresholdOverride={gage.roadSaddleHeight as number}
            primary={gage.roadDisplayName as string}
            sub={gage.locationInfo?.locationName}
          />
        )}
      />
      <FloodCard
        title={t("forecastScreen.floodingTitle")}
        subtitle={t("forecastScreen.floodingSubtitle")}
        rows={floodRows}
        wide={isWideScreen}
        first={roadRows.length === 0}
        renderRow={(gage) => (
          <FloodProbabilityRow
            gage={gage}
            threshold={gage.redStage as number}
            primary={gage.locationInfo?.locationName as string}
          />
        )}
      />
    </RowOrCell>
  );
});

export default FloodProbabilityCards;
