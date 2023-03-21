import React from "react"
import { ErrorBoundaryProps } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export default function ProfileScreen() {
  return (
    <Screen>
      <LargeTitle>
        Profile
      </LargeTitle>
      <Content>
      </Content>
    </Screen>
  )
}
