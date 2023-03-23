import React, { useEffect, useLayoutEffect } from "react";
import { observer } from "mobx-react-lite";
import localDayJs from "@services/localDayJs";

import { Card } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { If } from "@common-ui/components/Conditional";
import { LabelText, SmallerText, SmallText, SmallTitle } from "@common-ui/components/Text";

import { DataPoint, Forecast } from "@models/Forecasts";
import { useStores } from "@models/helpers/useStores";
import { GageSummary } from "@models/RootStore";

import { formatDateTime } from "@utils/useTimeFormat";
import { formatFlow, formatFlowTrend, formatHeight } from "@utils/utils";
import { Spacing } from "@common-ui/constants/spacing";
import { Colors } from "@common-ui/constants/colors";
import { Link } from "expo-router";
import { ROUTES } from "app/_layout";
import Icon from "@common-ui/components/Icon";
import { useTimeout } from "@utils/useTimeout";
import { Timing } from "@common-ui/constants/timing";

interface GageSummaryProps {
  gage: GageSummary
  noDetails?: boolean
}

function ReadingRow(props: { reading: DataPoint, delta?: number }) {
  const { reading, delta } = props

  if (!reading) {
    return null
  }

  return (
    <Row align="space-between" innerHorizontal={Spacing.tiny} top={Spacing.tiny}>
      <Cell flex>
        <SmallerText>{formatDateTime(reading.timestamp)}</SmallerText>
      </Cell>
      <If condition={!!reading?.reading}>
        <Cell flex>
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
          Past 24hr max:
        </LabelText>
        <ReadingRow reading={forecast?.maxReading} />
      </Cell>
    )
  }
)

export const GageSummaryCard = observer(
  function GageSummaryCard(props: GageSummaryProps) {
    const { gage, noDetails } = props

    const { forecastsStore } = useStores()

    const [showMaxReading, setShowMaxReading] = React.useState<boolean>(false)

    // Max reading computation is a bit expensive on mobile
    // So we're trying to delay that a bit to improve UX
    useTimeout(() => {
      setShowMaxReading(true)
    }, Timing.instant)

    const forecast = forecastsStore.getForecast(gage.id)
    
    const gageTitle = gage.title
    const peaks = forecast?.noaaForecast?.peaks

    return (
      <Card flex>
        <Row align="space-between">
          <SmallTitle color={Colors.primary}>{gageTitle}</SmallTitle>
          <If condition={!noDetails}>
            <Link href={`${ROUTES.Forecast}/${gage.id}`}>
              <Row justify="center">
                <LabelText color={Colors.blue}>Details</LabelText>
                <Icon name="chevron-right" color={Colors.blue} size={Spacing.medium} />
              </Row>
            </Link>
          </If>
        </Row>
        <Cell top={Spacing.small}>
          <LabelText color={Colors.success}>
            Latest Reading:
          </LabelText>
          <ReadingRow reading={forecast?.latestReading} delta={forecast.predictedCfsPerHour} />
        </Cell>
        <If condition={showMaxReading}>
          <MaxReading forecast={forecast} />
        </If>
        <Cell top={Spacing.small}>
          <LabelText color={Colors.success}>
            Forecasted crests:
            <SmallText muted> (published {formatDateTime(forecast?.noaaForecast?.created)})</SmallText>
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

    const { forecastsStore } = useStores()

    const forecast = forecastsStore.getForecast(gage.id)
    
    return (
      <Card flex>
        <Row align="space-between">
          <SmallTitle color={Colors.primary}>Details</SmallTitle>
        </Row>
        <Row top={Spacing.small} align="space-between" justify="flex-start">
          <Cell flex>
            <LabelText color={Colors.success}>
              Last 100 Readings:
            </LabelText>
            {forecast?.last100Readings?.map(reading => (
              <ReadingRow key={reading.timestamp} reading={reading} />
            ))}
          </Cell>
          <Cell flex>
            <LabelText color={Colors.success}>
              Currently Forecasted:
            </LabelText>
            {forecast?.last100ForecastReadings?.map(reading => (
              <ReadingRow key={reading.timestamp} reading={reading} />
            ))}
          </Cell>
        </Row>
      </Card>
    )
  }
)
