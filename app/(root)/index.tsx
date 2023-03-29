import React from "react"
import { FlatList, ViewStyle } from "react-native"
import { ErrorBoundaryProps, Stack } from "expo-router"
import { observer } from "mobx-react-lite"

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import { t } from "@i18n/translate"
import { IconButton, LinkButton, OutlinedButton, SolidButton } from "@common-ui/components/Button"
import { AbsoluteContainer, Cell } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"
import { useStores } from "@models/helpers/useStores"
import { Spacing } from "@common-ui/constants/spacing"
import { LargeTitle } from "@common-ui/components/Text"
import { ForecastChart } from "@components/ForecastChart"
import { Card } from "@common-ui/components/Card"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const HomeScreen = observer(
  function HomeScreen() {
    const { gagesStore } = useStores()

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <Content noPadding>
          <FlatList
            style={$listStyles}
            data={gagesStore.gages}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.locationId}
            initialNumToRender={3}
            renderItem={({ item }) => (
              <Card height={200} bottom={Spacing.medium}>
                <AbsoluteContainer sticks={["bottom", "left", "right", "top"]}>
                </AbsoluteContainer>
                <Cell>
                  <LargeTitle>{item.locationId}</LargeTitle>
                </Cell>
              </Card>
            )}
          />
        </Content>
      </Screen>
    )
  }
)

const $listStyles: ViewStyle = {
  padding: Spacing.medium,
  paddingBottom: Spacing.zero,
}

export default HomeScreen
