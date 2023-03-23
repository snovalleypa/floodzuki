import React from "react"
import { ErrorBoundaryProps, useSearchParams, Stack } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { ExtendedGageSummaryCard, GageSummaryCard } from "@components/GageSummaryCard";
import { Cell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export default function ForecastDetailsScreen() {
  const { id } = useSearchParams()
  const store = useStores()

  // Pathname id can either be a simple gage like "USGS-38"
  // or a nested gage like "USGS-SF17/USGS-38-0001" which will be
  // represented as an array of strings ["USGS-SF17", "USGS-38-0001"]
  const gageId = Array.isArray(id) ? id.join("/") : id

  const forecastGage = store.getForecastGage(gageId)

  return (
    <Screen>
      <Stack.Screen options={{ title: `Floodzilla Gage Network - Forecast: ${forecastGage?.title}` }} />
      <Cell left={Spacing.medium} top={Spacing.large}>
        <LargeTitle>
          {forecastGage?.title}
        </LargeTitle>
      </Cell>
      <Content scrollable>
        <ForecastChart />
        <Cell top={Spacing.mediumXL}>
          <GageSummaryCard
            gage={forecastGage}
            noDetails
          />
        </Cell>
        <Cell top={Spacing.mediumXL}>
          <ExtendedGageSummaryCard gage={forecastGage} />
        </Cell>
      </Content>
    </Screen>
  )
}
