import React from "react";
import { observer } from "mobx-react-lite";

import { Card } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { LabelText, SmallerText, SmallText, SmallTitle } from "@common-ui/components/Text";

import { DataPoint, Forecast } from "@models/Forecasts";
import { useStores } from "@models/helpers/useStores";
import { GageSummary } from "@models/RootStore";

import { formatDateTime } from "@utils/useTimeFormat";
import { formatFlow, formatFlowTrend, formatHeight } from "@utils/utils";
import { Spacing } from "@common-ui/constants/spacing";
import { Colors } from "@common-ui/constants/colors";
import { useRouter } from "expo-router";
import { ROUTES } from "app/_layout";
import { useTimeout } from "@utils/useTimeout";
import { Timing } from "@common-ui/constants/timing";
import { isMobile, useResponsive } from "@common-ui/utils/responsive";
import { t } from "@i18n/translate";
import { IconButton } from "@common-ui/components/Button";

interface GageSummaryProps {
  gage: GageSummary
  firstItem?: boolean
  noDetails?: boolean
}

function ReadingRow(props: { reading?: DataPoint, delta?: number }) {
  const { reading, delta } = props

  if (!reading) {
    return null
  }

  return (
    <Row flex align="space-between" innerHorizontal={Spacing.tiny} top={Spacing.tiny}>
      <Cell flex={2}>
        <SmallerText>{formatDateTime(reading.timestamp)}</SmallerText>
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
  )
}

// TODO: This is causing performance issues on devices
// figure out how to optimize that
const MaxReading = observer(
  function MaxReading(props: { forecast: Forecast }) {
    const { forecast } = props

    return (
      <Cell top={Spacing.small}>
        <LabelText color={Colors.success}>
          {t("forecastScreen.pastMax")}:
        </LabelText>
        <ReadingRow reading={forecast?.maxReading} />
      </Cell>
    )
  }
)

export const GageSummaryCard = observer(
  function GageSummaryCard(props: GageSummaryProps) {
    const { gage, firstItem, noDetails } = props

    const { forecastsStore } = useStores()
    const { isWideScreen } = useResponsive()
    const router = useRouter()

    const [showMaxReading, setShowMaxReading] = React.useState<boolean>(true)

    // Max reading computation is a bit expensive on mobile
    // So we're trying to delay that a bit to improve UX
    useTimeout(() => {
      setShowMaxReading(true)
    }, Timing.zero)

    const showDetails = () => {
      router.push({ pathname: ROUTES.ForecastDetails, params: { id: gage.id }})
    }

    const forecast = forecastsStore.getForecast(gage.id)
    
    const gageTitle = gage.title
    const peaks = forecast?.noaaForecast?.peaks

    const $offsetLeft = (!firstItem && isWideScreen) ? Spacing.medium : 0
    const $offsetTop = (!isWideScreen && firstItem) ? 0 : Spacing.medium

    return (
      <Card flex left={$offsetLeft} top={$offsetTop}>
        <Row align="space-between">
          <SmallTitle color={Colors.primary}>{gageTitle}</SmallTitle>
          <If condition={!noDetails}>
            <IconButton
              title={t("forecastScreen.details")}
              rightIcon="chevron-right"
              textColor={Colors.blue}
              onPress={showDetails}
            />
          </If>
        </Row>
        <Cell top={Spacing.small}>
          <LabelText color={Colors.success}>
            {t("forecastScreen.latestReading")}:
          </LabelText>
          <ReadingRow reading={forecast?.latestReading} delta={forecast?.predictedCfsPerHour} />
        </Cell>
        {/* This is done for performance reason. Defer reading the expensive computation */}
        <Ternary condition={showMaxReading}>
          <MaxReading forecast={forecast} />
          <Cell top={Spacing.small}>
            <LabelText color={Colors.success}>
              {t("forecastScreen.pastMax")}:
            </LabelText>
            <Cell height={18} />
          </Cell>
        </Ternary>
        <Cell top={Spacing.small}>
          <LabelText color={Colors.success}>
            {t("forecastScreen.forecastedCrests")}:
            <SmallText muted> ({t("forecastScreen.published")} {formatDateTime(forecast?.noaaForecast?.created)})</SmallText>
          </LabelText>
          {peaks?.map(peak => (
            <ReadingRow key={peak.timestamp} reading={peak} />
          ))}
        </Cell>
      </Card>
    )
  }
)

export const ExtendedGageSummaryCard = observer(
  function ExtendedGageSummaryCard(props: GageSummaryProps) {
    const { gage } = props

    const { isMobile } = useResponsive()
    const { forecastsStore } = useStores()

    const forecast = forecastsStore.getForecast(gage.id)
    
    return (
      <Card>
        <Row align="space-between">
          <SmallTitle color={Colors.primary}>Details</SmallTitle>
        </Row>
        <RowOrCell flex justify="flex-start" align="space-between">
          <Cell flex top={Spacing.small}>
            <LabelText color={Colors.success}>
              {t("forecastScreen.lastReadings")}:
            </LabelText>
            {forecast?.last100Readings?.map(reading => (
              <ReadingRow key={reading.timestamp} reading={reading} />
            ))}
          </Cell>
          <Cell flex={isMobile ? 0 : 1} top={Spacing.small}>
            <LabelText color={Colors.success}>
              {t("forecastScreen.currentlyForecasted")}:
            </LabelText>
            {forecast?.last100ForecastReadings?.map(reading => (
              <ReadingRow key={reading.timestamp} reading={reading} />
            ))}
          </Cell>
        </RowOrCell>
      </Card>
    )
  }
)
