import React from "react"
import { ErrorBoundaryProps, Stack } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { GageSummaryCard } from "@components/GageSummaryCard";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
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
        <RowOrCell flex align="flex-start" justify="stretch" top={Spacing.mediumXL}>
          {forecastGages.map((gage, i) => (
            <GageSummaryCard firstItem={i === 0} key={gage.id} gage={gage} />
          ))}
        </RowOrCell>
      </Content>
    </Screen>
  )
}
