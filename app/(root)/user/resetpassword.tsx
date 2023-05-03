import React, { useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router"

import { Screen, Content } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { observer } from "mobx-react-lite"
import { useStores } from "@models/helpers/useStores"
import { ROUTES } from "app/_layout"
import ChangePasswordForm, { PasswordSubmitActionProps } from "@components/ChangePasswordForm"
import { Spacing } from "@common-ui/constants/spacing"
import { normalizeSearchParams } from "@utils/navigation"
import { useLocale } from "@common-ui/contexts/LocaleContext"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ResetPasswordScreen = observer(
  function ResetPasswordScreen() {
    const router = useRouter()
    const navigation = useNavigation()
    const { t } = useLocale();

    const { userId, code } = useLocalSearchParams()

    const { authSessionStore } = useStores()

    const [successMessage, setSuccessMessage] = useState<string>("")

    if (!userId || !code) {
      return <Redirect href={ROUTES.Home} />
    }

    const onSubmit = async (params: PasswordSubmitActionProps) => {
      if (!userId || !code) return

      setSuccessMessage("")

      await authSessionStore.resetPassword({
        userId: normalizeSearchParams(userId),
        code: normalizeSearchParams(code),
        newPassword: params.newPassword,
      })

      if (authSessionStore.isError) return
      
      setSuccessMessage(t("resetpasswordScreen.successMessage"))
    }

    const goBack = () => {
      navigation.canGoBack() ?
        navigation.goBack() :
        router.push({ pathname: ROUTES.UserProfile })
    }

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.passwordResetScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <ChangePasswordForm
            submitAction={onSubmit}
            submitActionText={t("resetpasswordScreen.submit")}
            successMessage={successMessage}
            errorMessage={authSessionStore.errorMessage}
          />
        </Content>
      </Screen>
    )
  }
)

export default ResetPasswordScreen
