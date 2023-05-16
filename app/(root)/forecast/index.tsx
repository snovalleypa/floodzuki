import React, { useEffect, useState } from "react"
import { ErrorBoundaryProps, Stack } from "expo-router";
import { observer } from "mobx-react-lite";

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { GageSummaryCard } from "@components/GageSummaryCard";
import { Cell, RowOrCell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";
import Config from "@config/config";
import { useInterval, useTimeout } from "@utils/useTimeout";
import { Timing } from "@common-ui/constants/timing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import ForecastFooter from "@components/ForecastFooter";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { isAndroid } from "@common-ui/utils/responsive";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ForecastScreen = observer(
  function ForecastScreen() {
    const store = useStores()
    const { t } = useLocale();

    const [hidden, setHidden] = React.useState(true)

    useTimeout(() => {
      setHidden(false)
    }, Timing.zero)

    // Check for new readings every 1 minute
    useInterval(() => {
      store.forecastsStore.fetchRecentReadings()
    }, Timing.oneMinute)

    // Check for forecast data every 5 mins
    useInterval(() => {
      store.forecastsStore.fetchForecast()
    }, Timing.fiveMinutes)

    // Fetch data on mount
    useEffect(() => {
      if (store.isFetched)  {
        store.forecastsStore.fetchData()
      }
    }, [store.isFetched])

    const [hideChart, setHideChart] = useState(false)

    // On Android WebView might crash if user scrolls to the bottom of the screen
    // and triggers the scroll bounce effect. This is a workaround to prevent that.
    // As soon as the chart goes out of view, we hide it.
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isAndroid) {
        return
      }

      const { y: scrollHeight } = event.nativeEvent.contentOffset
      const { height: screenHeight } = event.nativeEvent.layoutMeasurement
      const { height: contentHeight } = event.nativeEvent.contentSize
      const bottomOffset = 300

      const nextHideChart = scrollHeight + screenHeight + bottomOffset > contentHeight
      
      if (hideChart !== nextHideChart && !!scrollHeight) {
        setHideChart(nextHideChart)
      }
    }

    const gageIds = Config.FORECAST_GAGE_IDS
    const forecastGages = hidden ? [] : store.getForecastGages(gageIds)

    return (
      <Screen>
        {/* This is purely for documentTitle setting */}
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("forecastScreen.title")}` }} />
        <Content scrollable onScroll={handleScroll}>
          <ForecastChart gages={forecastGages} hideChart={hideChart} />
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
