import React from "react"
import { ErrorBoundaryProps } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { GageSummary } from "@components/GageSummary";
import { Row } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export default function ForecastScreen() {
  return (
    <Screen>
      <LargeTitle>
        Forecast
      </LargeTitle>
      <Content>
        <ForecastChart />
        <Row align="space-between" top={Spacing.mediumXL}>
          <GageSummary />
          <GageSummary />
          <GageSummary />
        </Row>
      </Content>
    </Screen>
  )
}
