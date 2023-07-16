import React from "react";
import { observer } from "mobx-react-lite";

import { Card, CardFooter } from "@common-ui/components/Card";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { LabelText, SmallerText, SmallText, SmallTitle } from "@common-ui/components/Text";

import { DataPoint, Forecast } from "@models/Forecasts";
import { useStores } from "@models/helpers/useStores";
import { GageSummary } from "@models/RootStore";

import { formatDateTime } from "@utils/useTimeFormat";
import { useUtils } from "@utils/utils";
import { Spacing } from "@common-ui/constants/spacing";
import { Colors } from "@common-ui/constants/colors";
import { Link } from "expo-router";
import { ROUTES } from "app/_layout";
import { useTimeout } from "@utils/useTimeout";
import { Timing } from "@common-ui/constants/timing";
import { useResponsive } from "@common-ui/utils/responsive";
import { IconButton, LinkButton } from "@common-ui/components/Button";
import { openLinkInBrowser } from "@utils/navigation";
import { useLocale } from "@common-ui/contexts/LocaleContext";

interface GageSummaryProps {
  gage: GageSummary
  firstItem?: boolean
  noDetails?: boolean
}

function ReadingRow(props: { reading?: DataPoint, delta?: number }) {
  const { reading, delta } = props

  const { formatFlow, formatFlowTrend, formatHeight } = useUtils()

  if (!reading) {
    return null
  }

  return (
    <Row flex align="space-between" innerHorizontal={Spacing.tiny} innerVertical={Spacing.micro} top={Spacing.tiny}>
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

const MaxReading = observer(
  function MaxReading(props: { forecast: Forecast }) {
    const { t } = useLocale()
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

    const { t } = useLocale()
    const { forecastsStore } = useStores()
    const { isWideScreen } = useResponsive()

    const [showMaxReading, setShowMaxReading] = React.useState<boolean>(true)

    // Max reading computation is a bit expensive on mobile
    // So we're trying to delay that a bit to improve UX
    useTimeout(() => {
      setShowMaxReading(true)
    }, Timing.zero)

    const openNoaaPage = () => {
      openLinkInBrowser(`http://www.nwrfc.noaa.gov/river/station/flowplot/flowplot.cgi?${gage?.nwrfcId}`)
    }

    const forecast = forecastsStore.getForecast(gage?.id)
    
    const gageTitle = gage?.title
    const peaks = forecast?.peaks

    const $offsetLeft = (!firstItem && isWideScreen) ? Spacing.medium : 0
    const $offsetTop = (!isWideScreen && firstItem) ? 0 : Spacing.medium

    return (
      <Card flex left={$offsetLeft} top={$offsetTop}>
        <Row align="space-between">
          <SmallTitle color={Colors.primary}>{gageTitle}</SmallTitle>
          <Ternary condition={!noDetails}>
            <Link href={{ pathname: ROUTES.ForecastDetails, params: { id: gage?.id } }} asChild>
              <IconButton
                title={t("forecastScreen.details")}
                rightIcon="chevron-right"
                textColor={Colors.blue}
              />
            </Link>
            <If condition={!gage?.isMetagage}>
              <Link href={{ pathname: ROUTES.GageDetails, params: { id: gage?.id } }} asChild>
                <IconButton
                  title={t("forecastScreen.viewGage")}
                  rightIcon="chevron-right"
                  textColor={Colors.blue}
                />
              </Link>
            </If>
          </Ternary>
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
      </Card>
    )
  }
)

export const ExtendedGageSummaryCard = observer(
  function ExtendedGageSummaryCard(props: GageSummaryProps) {
    const { gage } = props

    const { t } = useLocale()
    const { isMobile } = useResponsive()
    const { forecastsStore } = useStores()

    const forecast = forecastsStore.getForecast(gage?.id)
    
    return (
      <Card>
        <Row align="space-between">
          <SmallTitle color={Colors.primary}>{t("forecastScreen.details")}</SmallTitle>
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
