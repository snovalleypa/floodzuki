import React from "react"
import { ErrorBoundaryProps, Stack } from "expo-router"
import { observer } from "mobx-react-lite"

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import { Spacing } from "@common-ui/constants/spacing"
import { Cell } from "@common-ui/components/Common"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const HomeScreen = observer(
  function HomeScreen() {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Floodzilla Gage Network - Snoqualmie River / SVPA" }} />
        <Cell left={Spacing.medium} top={Spacing.large}>
          <LargeTitle>
            Active
          </LargeTitle>
        </Cell>
        <Content>
        </Content>
      </Screen>
    )
  }
)

export default HomeScreen
