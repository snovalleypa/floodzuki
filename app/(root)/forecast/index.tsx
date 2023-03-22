import React, { useEffect } from "react"
import { ErrorBoundaryProps } from "expo-router";
import { InteractionManager, Platform } from "react-native";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { GageSummaryCard } from "@components/GageSummaryCard";
import { Cell, Row } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";
import Config from "@config/config";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export default function ForecastScreen() {
  const store = useStores()

  const [isLoaded, setIsLoaded] = React.useState(false)

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsLoaded(true)
    })
  }, [])

  const gageIds = Config.FORECAST_GAGE_IDS
  const forecastGages = store.getForecastGages(gageIds)

  const Wrapper = Platform.OS === "web" ? Row : Cell

  if (!isLoaded) {
    return null
  }

  return (
    <Screen>
      <LargeTitle>
        Forecast
      </LargeTitle>
      <Content scrollable>
        <ForecastChart />
        <Wrapper justify="flex-start" top={Spacing.mediumXL}>
          {forecastGages.map(gage => (
            <GageSummaryCard key={gage.id} gage={gage} />
          ))}
        </Wrapper>
      </Content>
    </Screen>
  )
}
