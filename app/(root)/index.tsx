import React from "react"
import { ErrorBoundaryProps, Stack } from "expo-router"
import { observer } from "mobx-react-lite"

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import { t } from "@i18n/translate"
import { IconButton, LinkButton, OutlinedButton, SolidButton } from "@common-ui/components/Button"
import { Cell } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const HomeScreen = observer(
  function HomeScreen() {
    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <Content>
        </Content>
      </Screen>
    )
  }
)

export default HomeScreen
