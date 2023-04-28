import React, { useEffect, useMemo, useRef, useState } from "react"
import { ErrorBoundaryProps, Stack, useLocalSearchParams, useRouter } from "expo-router"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText, RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import { OutlinedButton, SimpleLinkButton, SolidButton } from "@common-ui/components/Button"
import { observer } from "mobx-react-lite"
import { useStores } from "@models/helpers/useStores"
import { If, Ternary } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import { useValidations } from "@utils/useValidations"
import { normalizeSearchParams, openLinkInBrowser } from "@utils/navigation"
import SuccessMessage from "@common-ui/components/SuccessMessage"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const UnsubscribeScreen = observer(
  function UnsubscribeScreen() {
    const router = useRouter()
    const { authSessionStore } = useStores()

    const { userId, email } = useLocalSearchParams()

    const [isUnsubscribed, setIsUnsubscribed] = useState(false)

    const unsubscribe = async () => {
      await authSessionStore.unsubscribeFromNotifications(normalizeSearchParams(userId))

      if (!authSessionStore.isError) {
        setIsUnsubscribed(true)
      }
    }

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()

      if (!userId || !email) {
        router.replace({ pathname: ROUTES.Home })
      }
    }, [router])

    const goBack = () => {
      router.push({ pathname: ROUTES.UserAlerts })
    }

    const goHome = () => {
      router.push({ pathname: ROUTES.Home })
    }

    const contactUs = () => {
      openLinkInBrowser("mailto:floodzilla.support@svpa.us")
    }

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.unsubscribeScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <Card bottom={Spacing.large}>
            <CardContent>
              <If condition={!authSessionStore.isFetching}>
                <Ternary condition={authSessionStore.isError}>
                  <Cell>
                    <ErrorMessage
                      errorText={authSessionStore.errorMessage ?? "We're sorry, but an error has occurred while processing your unsubscribe request."}
                    />
                    <RegularText>
                      Please <SimpleLinkButton text="contact us" onPress={contactUs} /> so we can remove your subscription.
                    </RegularText>
                    <SolidButton
                      selfAlign="center"
                      title="Try again"
                      onPress={unsubscribe}
                    />
                  </Cell>
                  <Ternary condition={isUnsubscribed}>
                    <Cell>
                      <SuccessMessage
                        successText="Your preferences have been updated."
                      />
                      <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                        <OutlinedButton
                          minWidth={Spacing.extraExtraHuge}
                          selfAlign="center"
                          title="Manage your alerts"
                          onPress={goBack}
                        />
                        <SolidButton
                          minWidth={Spacing.extraExtraHuge}
                          selfAlign="center"
                          title="Continue to Floodzilla"
                          onPress={goHome}
                        />
                      </Row>
                    </Cell>
                    <Cell>
                      <RegularText align="center">
                        If you unsubscribe, you will no longer receive Floodzilla Alerts at <MediumText>{email}</MediumText>.
                      </RegularText>
                      <SolidButton
                        top={Spacing.medium}
                        selfAlign="center"
                        title="Unsubscribe All"
                        onPress={unsubscribe}
                      />
                    </Cell>
                  </Ternary>
                </Ternary>
              </If>
            </CardContent>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default UnsubscribeScreen
