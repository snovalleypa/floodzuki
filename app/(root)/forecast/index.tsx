import React, { useEffect } from "react"
import { ErrorBoundaryProps, Stack } from "expo-router";
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

  const gageIds = Config.FORECAST_GAGE_IDS
  const forecastGages = store.getForecastGages(gageIds)

  const Wrapper = Platform.OS === "web" ? Row : Cell

  return (
    <Screen>
      {/* This is purely for documentTitle setting */}
      <Stack.Screen options={{ title: "Floodzilla Gage Network - Forecast" }} />
      <Cell left={Spacing.medium} top={Spacing.medium}>
        <LargeTitle>
          Forecast
        </LargeTitle>
      </Cell>
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
