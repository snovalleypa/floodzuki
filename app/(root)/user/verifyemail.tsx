import React, { useEffect, useMemo, useRef, useState } from "react"
import { ErrorBoundaryProps, Stack, useLocalSearchParams, useRouter } from "expo-router"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import { SolidButton } from "@common-ui/components/Button"
import { observer } from "mobx-react-lite"
import { useStores } from "@models/helpers/useStores"
import { If, Ternary } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { useValidations } from "@utils/useValidations"
import { normalizeSearchParams } from "@utils/navigation"
import SuccessMessage from "@common-ui/components/SuccessMessage"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const VerifyEmailScreen = observer(
  function VerifyEmailScreen() {
    const router = useRouter()
    const { authSessionStore } = useStores()

    const { userId, token } = useLocalSearchParams()

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()

      if (!userId || !token) {
        router.push({ pathname: ROUTES.Home })
      }

      const verifyEmail = async () => {
        await authSessionStore.verifyEmail({ token: normalizeSearchParams(token) })
      }

      verifyEmail()
    }, [])

    const goBack = () => {
      router.push({ pathname: ROUTES.UserAlerts })
    }

    const goHome = () => {
      router.push({ pathname: ROUTES.Home })
    }

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.verifyemailScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <Card bottom={Spacing.large}>
            <CardContent>
              <If condition={!authSessionStore.isFetching}>
                <Ternary condition={authSessionStore.isError}>
                  <Cell>
                    <ErrorMessage
                      errorText={authSessionStore.errorMessage ?? "An error occurred"}
                    />
                    <SolidButton
                      selfAlign="center"
                      title="Try again"
                      onPress={goHome}
                    />
                  </Cell>
                  <Cell>
                    <SuccessMessage
                      successText="Your email address has been verified!"
                    />
                    <SolidButton
                      selfAlign="center"
                      title="Continue to Floodzilla"
                      onPress={goHome}
                    />
                  </Cell>
                </Ternary>
              </If>
            </CardContent>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default VerifyEmailScreen
