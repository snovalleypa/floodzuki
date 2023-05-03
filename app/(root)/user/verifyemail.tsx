import React, { useEffect } from "react"
import { ErrorBoundaryProps, Stack, useLocalSearchParams, useRouter } from "expo-router"
import { observer } from "mobx-react-lite"

import { Screen, Content } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent } from "@common-ui/components/Card"
import { Cell } from "@common-ui/components/Common"
import { SolidButton } from "@common-ui/components/Button"
import { useStores } from "@models/helpers/useStores"
import { If, Ternary } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { normalizeSearchParams } from "@utils/navigation"
import SuccessMessage from "@common-ui/components/SuccessMessage"
import { useLocale } from "@common-ui/contexts/LocaleContext"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const VerifyEmailScreen = observer(
  function VerifyEmailScreen() {
    const router = useRouter()
    const { t } = useLocale();
    const { authSessionStore } = useStores()

    const { userId, token } = useLocalSearchParams()

    const verifyEmail = async () => {
      await authSessionStore.verifyEmail({ token: normalizeSearchParams(token) })
    }

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()

      if (!userId || !token) {
        router.push({ pathname: ROUTES.Home })
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
                      errorText={authSessionStore.errorMessage ?? t("verifyemailScreen.errorMessage")}
                    />
                    <SolidButton
                      selfAlign="center"
                      title={t("verifyemailScreen.tryAgain")}
                      onPress={verifyEmail}
                    />
                  </Cell>
                  <Cell>
                    <SuccessMessage
                      successText={t("verifyemailScreen.successMessage")}
                    />
                    <SolidButton
                      selfAlign="center"
                      title={t("verifyemailScreen.continue")}
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
