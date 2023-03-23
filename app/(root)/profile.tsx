import React from "react"
import { ErrorBoundaryProps, Stack } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { Cell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export default function ProfileScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: "Floodzilla Gage Network - Profile" }} />
      <Cell left={Spacing.medium} top={Spacing.medium}>
        <LargeTitle>
          Profile
        </LargeTitle>
      </Cell>
      <Content>
      </Content>
    </Screen>
  )
}
