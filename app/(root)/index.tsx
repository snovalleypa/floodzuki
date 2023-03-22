import React from "react"
import { ErrorBoundaryProps } from "expo-router"
import { observer } from "mobx-react-lite"

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const HomeScreen = observer(
  function HomeScreen() {
    return (
      <Screen>
        <LargeTitle>
          Active
        </LargeTitle>
        <Content>
        </Content>
      </Screen>
    )
  }
)

export default HomeScreen
