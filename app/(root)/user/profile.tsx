import React from "react"
import { ErrorBoundaryProps, Stack } from "expo-router";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { Cell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";
import { t } from "@i18n/translate";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export default function ProfileScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: `${t("common.title")} - ${t("profileScreen.title")}` }} />
      <Cell left={Spacing.medium} top={Spacing.medium}>
        <LargeTitle>
          {t("profileScreen.title")}
        </LargeTitle>
      </Cell>
      <Content>
      </Content>
    </Screen>
  )
}
