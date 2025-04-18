import React, { useEffect } from "react"
import { ErrorBoundaryProps, Stack } from "expo-router";
import Head from "expo-router/head";

import { observer } from "mobx-react-lite";

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { GageSummaryCard } from "@components/GageSummaryCard";
import { RowOrCell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";
import Config from "@config/config";
import { useInterval, useTimeout } from "@utils/useTimeout";
import { Timing } from "@common-ui/constants/timing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import ForecastFooter from "@components/ForecastFooter";
import { isMobile } from "@common-ui/utils/responsive";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ForecastScreen = observer(
  function ForecastScreen() {
    const store = useStores()
    const { t } = useLocale();

    const [hidden, setHidden] = React.useState(isMobile ? true : false)

    const fetchData = async () => {
      await store.locationInfoStore.fetchData()
      await store.forecastsStore.fetchData()
    }

    useTimeout(() => {
      setHidden(false)
    }, Timing.zero)

    // Check for new readings every 1 minute
    useInterval(() => {
      store.forecastsStore.fetchRecentReadings()
    }, Timing.fiveMinutes)

    // Check for forecast data every 5 mins
    useInterval(() => {
      store.forecastsStore.fetchForecast()
    }, Timing.fiveMinutes)

    // Fetch data on mount
    useEffect(() => {
      if (store.isFetched)  {
        fetchData()
      }
    }, [store.isFetched])
  
    const gageIds = Config.FORECAST_GAGE_IDS
    const forecastGages = hidden ? [] : store.getForecastGages(gageIds)

    return (
      <Screen>
        {/* This is purely for documentTitle setting */}
        <Head>
          <title>{t("common.title")} - {t("forecastScreen.title")}</title>
        </Head>
        <Content scrollable onRefresh={fetchData}>
          <ForecastChart gages={forecastGages} />
          <RowOrCell flex align="flex-start" justify="stretch" top={Spacing.mediumXL}>
            {forecastGages.map((gage, i) => (
              <GageSummaryCard firstItem={i === 0} key={gage.id} gage={gage} />
            ))}
          </RowOrCell>
          <ForecastFooter />
        </Content>
      </Screen>
    )
  }
)

export default ForecastScreen
