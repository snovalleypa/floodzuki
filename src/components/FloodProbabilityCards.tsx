import React from "react";
import { observer } from "mobx-react-lite";

import { Gage } from "@models/Gage";
import { useStores } from "@models/helpers/useStores";
import { Card, CardHeader } from "@common-ui/components/Card";
import { Cell, Separator } from "@common-ui/components/Common";
import { LabelText, SmallTitle } from "@common-ui/components/Text";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { selectCardMembership } from "@utils/floodCardMembership";
import FloodProbabilityRow from "@components/FloodProbabilityRow";

interface FloodCardProps {
  title: string;
  subtitle: string;
  rows: Gage[];
  top?: number;
  renderRow: (gage: Gage) => React.ReactNode;
}

/** Shared card chrome (header + separated rows) for both flood-probability cards. */
const FloodCard = ({ title, subtitle, rows, top, renderRow }: FloodCardProps) => {
  if (rows.length === 0) {
    return null;
  }
  return (
    <Card top={top} innerHorizontal={0}>
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
 * `selectCardMembership` over the river-ordered gauge list.
 */
const FloodProbabilityCards = observer(function FloodProbabilityCards() {
  const { getAllLocationsWithGages } = useStores();
  const { t } = useLocale();

  const gages = getAllLocationsWithGages();
  const { roadRows, floodRows } = selectCardMembership(gages);

  return (
    <>
      <FloodCard
        title={t("forecastScreen.roadFloodingTitle")}
        subtitle={t("forecastScreen.roadFloodingSubtitle")}
        rows={roadRows}
        top={Spacing.mediumXL}
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
        top={Spacing.medium}
        renderRow={(gage) => (
          <FloodProbabilityRow
            gage={gage}
            threshold={gage.redStage as number}
            primary={gage.locationInfo?.locationName as string}
          />
        )}
      />
    </>
  );
});

export default FloodProbabilityCards;
