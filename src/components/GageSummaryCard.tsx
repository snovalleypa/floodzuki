import React from "react";
import { Pressable } from "react-native";
import { observer } from "mobx-react-lite";

import { Card, CardFooter } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { LabelText, SmallerText, SmallText, SmallTitle } from "@common-ui/components/Text";

import { DataPoint, Forecast } from "@models/Forecasts";
import { useStores } from "@models/helpers/useStores";
import { GageSummary } from "@models/RootStore";

import { buildCrestTimestampSet } from "@utils/crestUtils";
import { formatDateTime } from "@utils/useTimeFormat";
import { useUtils } from "@utils/utils";
import { Spacing } from "@common-ui/constants/spacing";
import { Colors } from "@common-ui/constants/colors";
import { Link } from "expo-router";
import { ROUTES } from "app/_layout";
import { useTimeout } from "@utils/useTimeout";
import { Timing } from "@common-ui/constants/timing";
import { useResponsive } from "@common-ui/utils/responsive";
import { LinkButton } from "@common-ui/components/Button";
import { openLinkInBrowser } from "@utils/navigation";
import { useLocale } from "@common-ui/contexts/LocaleContext";

const CREST_ARROW = "▲";

interface GageSummaryProps {
  gage: GageSummary;
  firstItem?: boolean;
  noDetails?: boolean;
  onPress?: () => void;
}

function ReadingRow(props: {
  reading?: DataPoint;
  delta?: number;
  isCrest?: boolean;
  showCrestSlot?: boolean;
}) {
  const { reading, delta, isCrest, showCrestSlot } = props;

  const { formatFlow, formatFlowTrend, formatHeight } = useUtils();
  const { getTimezone } = useStores();

  if (!reading) {
    return null;
  }

  return (
    <Row
      flex
      align="space-between"
      innerHorizontal={Spacing.tiny}
      innerVertical={Spacing.micro}
      top={Spacing.tiny}>
      <If condition={!!showCrestSlot}>
        <Cell width={16}>
          <SmallerText color={Colors.primary}>{isCrest ? CREST_ARROW : ""}</SmallerText>
        </Cell>
      </If>
      <Cell flex={2}>
        <SmallerText>{formatDateTime(reading.timestamp, getTimezone())}</SmallerText>
      </Cell>
      <If condition={!!reading?.reading}>
        <Cell flex align="center">
          <SmallerText align="center">{formatHeight(reading.reading)}</SmallerText>
        </Cell>
      </If>
      <Cell flex>
        <SmallerText align="center">
          {formatFlow(reading.waterDischarge)}
          <If condition={!!delta}>
            <SmallerText> ({formatFlowTrend(delta)})</SmallerText>
          </If>
        </SmallerText>
      </Cell>
    </Row>
  );
}

function ColumnHeaderRow(props: { showCrestSlot?: boolean; showHeight?: boolean }) {
  const { showCrestSlot, showHeight = true } = props;
  const { t } = useLocale();

  return (
    <Row
      flex
      align="space-between"
      innerHorizontal={Spacing.tiny}
      innerVertical={Spacing.micro}
      top={Spacing.tiny}>
      <If condition={!!showCrestSlot}>
        <Cell width={16} />
      </If>
      <Cell flex={2}>
        <SmallerText color={Colors.darkGrey}>{t("forecastScreen.timeHeader")}</SmallerText>
      </Cell>
      <If condition={showHeight}>
        <Cell flex align="center">
          <SmallerText align="center" color={Colors.darkGrey}>
            {t("forecastScreen.heightHeader")}
          </SmallerText>
        </Cell>
      </If>
      <Cell flex>
        <SmallerText align="center" color={Colors.darkGrey}>
          {t("forecastScreen.flowHeader")}
        </SmallerText>
      </Cell>
    </Row>
  );
}

const MaxReading = observer(function MaxReading(props: { forecast: Forecast }) {
  const { t } = useLocale();
  const { forecast } = props;

  return (
    <Cell top={Spacing.small}>
      <LabelText color={Colors.success}>{t("forecastScreen.pastMax")}:</LabelText>
      <ReadingRow reading={forecast?.maxReading} />
    </Cell>
  );
});

export const GageSummaryCard = observer(function GageSummaryCard(props: GageSummaryProps) {
  const { gage, firstItem, noDetails, onPress } = props;

  const { t } = useLocale();
  const { forecastsStore, getTimezone } = useStores();
  const { isWideScreen } = useResponsive();

  const [showMaxReading, setShowMaxReading] = React.useState<boolean>(true);

  // Max reading computation is a bit expensive on mobile
  // So we're trying to delay that a bit to improve UX
  useTimeout(() => {
    setShowMaxReading(true);
  }, Timing.zero);

  const openNoaaPage = () => {
    openLinkInBrowser(
      `http://www.nwrfc.noaa.gov/river/station/flowplot/flowplot.cgi?${gage?.nwrfcId}`
    );
  };

  const forecast = forecastsStore.getForecast(gage?.id);

  const gageTitle = gage?.title;
  const peaks = forecast?.peaks;
  const predictionTime = forecast?.predictions?.forecastCreated;
  const hasHeight = forecast?.latestReading?.reading != null;

  const $offsetLeft = !firstItem && isWideScreen ? Spacing.medium : 0;
  const $offsetTop = !isWideScreen && firstItem ? 0 : Spacing.medium;

  const cardContents = (
    <>
      <Row align="space-between">
        <SmallTitle color={Colors.primary}>{gageTitle}</SmallTitle>
        <Ternary condition={!noDetails}>
          <Link href={{ pathname: ROUTES.ForecastDetails, params: { id: [gage?.id] } }} asChild>
            <LinkButton title={t("forecastScreen.details")} rightIcon="chevron-right" />
          </Link>
          <If condition={!gage?.isMetagage}>
            <Link href={{ pathname: ROUTES.GageDetails, params: { id: gage?.id } }} asChild>
              <LinkButton title={t("forecastScreen.viewGage")} rightIcon="chevron-right" />
            </Link>
          </If>
        </Ternary>
      </Row>
      <Cell maxWidth={600} innerBottom={Spacing.small}>
        <ColumnHeaderRow showHeight={hasHeight} />
        <Cell top={Spacing.small}>
          <LabelText color={Colors.success}>{t("forecastScreen.latestReading")}:</LabelText>
          <ReadingRow reading={forecast?.latestReading} delta={forecast?.predictedCfsPerHour} />
        </Cell>
        {/* This is done for performance reason. Defer reading the expensive computation */}
        <Ternary condition={showMaxReading}>
          <MaxReading forecast={forecast} />
          <Cell top={Spacing.small}>
            <LabelText color={Colors.success}>{t("forecastScreen.pastMax")}:</LabelText>
            <Cell height={18} />
          </Cell>
        </Ternary>
        <Cell top={Spacing.small}>
          <LabelText color={Colors.success}>
            <LabelText color={Colors.primary}>{`${CREST_ARROW} `}</LabelText>
            {t("forecastScreen.forecastedCrests")}:
            <SmallText muted>
              {" "}
              ({t("forecastScreen.published")} {formatDateTime(predictionTime, getTimezone())})
            </SmallText>
          </LabelText>
          {peaks?.map((peak) => (
            <ReadingRow key={peak.timestampMs} reading={peak as DataPoint} />
          ))}
        </Cell>
      </Cell>
      <If condition={!gage?.isMetagage && noDetails}>
        <CardFooter>
          <Cell flex align="center">
            <LinkButton
              selfAlign="center"
              title={`${t("forecastScreen.noaaGage")} ${gage?.nwrfcId}`}
              onPress={openNoaaPage}
            />
          </Cell>
        </CardFooter>
      </If>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={{ flex: 1, marginLeft: $offsetLeft, marginTop: $offsetTop }}>
        <Card flex>{cardContents}</Card>
      </Pressable>
    );
  }

  return (
    <Card flex={isWideScreen} left={$offsetLeft} top={$offsetTop}>
      {cardContents}
    </Card>
  );
});

const COLLAPSED_READING_COUNT = 3;

// Renders a reading list collapsed to the first few rows, with a centered
// show-more/less toggle when there are more rows than the collapsed limit.
function CollapsibleReadingList(props: {
  readings?: DataPoint[];
  showCrestSlot?: boolean;
  crestTimestamps?: Set<number>;
}) {
  const { readings, showCrestSlot, crestTimestamps } = props;
  const { t } = useLocale();
  const [expanded, setExpanded] = React.useState(false);

  if (!readings?.length) {
    return null;
  }

  const visibleReadings = expanded ? readings : readings.slice(0, COLLAPSED_READING_COUNT);
  const canExpand = readings.length > COLLAPSED_READING_COUNT;

  return (
    <>
      {visibleReadings.map((reading) => (
        <ReadingRow
          key={reading.timestamp}
          reading={reading}
          isCrest={
            !!showCrestSlot &&
            reading.timestampMs != null &&
            !!crestTimestamps?.has(reading.timestampMs)
          }
          showCrestSlot={showCrestSlot}
        />
      ))}
      <If condition={canExpand}>
        <Cell top={Spacing.small} align="center">
          <LinkButton
            selfAlign="center"
            title={expanded ? t("forecastScreen.showLess") : t("forecastScreen.showMore")}
            onPress={() => setExpanded(!expanded)}
          />
        </Cell>
      </If>
    </>
  );
}

export const ExtendedGageSummaryCard = observer(function ExtendedGageSummaryCard(
  props: GageSummaryProps
) {
  const { gage } = props;

  const { t } = useLocale();
  const { forecastsStore, getTimezone } = useStores();
  const { isWideScreen } = useResponsive();

  const forecast = forecastsStore.getForecast(gage?.id);
  const crestTimestamps = buildCrestTimestampSet(forecast?.peaks);
  const hasHeight = forecast?.latestReading?.reading != null;
  const predictionTime = forecast?.predictions?.forecastCreated;

  return (
    <RowOrCell flex={isWideScreen} justify="flex-start" align="flex-start" gap={Spacing.medium}>
      <Cell flex={isWideScreen} maxWidth={480}>
        <Card>
          <SmallTitle color={Colors.primary}>
            {t("forecastScreen.currentlyForecasted")}
            <SmallText muted>
              {" "}
              ({t("forecastScreen.published")} {formatDateTime(predictionTime, getTimezone())})
            </SmallText>
          </SmallTitle>
          <ColumnHeaderRow showCrestSlot showHeight={hasHeight} />
          <CollapsibleReadingList
            readings={forecast?.last100ForecastReadings}
            showCrestSlot
            crestTimestamps={crestTimestamps}
          />
        </Card>
      </Cell>
      <Cell flex={isWideScreen} maxWidth={480}>
        <Card>
          <SmallTitle color={Colors.primary}>{t("forecastScreen.lastReadings")}</SmallTitle>
          <ColumnHeaderRow showHeight={hasHeight} />
          <CollapsibleReadingList readings={forecast?.last100Readings} />
        </Card>
      </Cell>
    </RowOrCell>
  );
});
