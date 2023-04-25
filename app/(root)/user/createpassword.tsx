import React, { useState } from "react"
import { ErrorBoundaryProps, Stack, useNavigation, useRouter } from "expo-router"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { RegularText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { observer } from "mobx-react-lite"
import { Card } from "@common-ui/components/Card"
import { useStores } from "@models/helpers/useStores"
import { ROUTES } from "app/_layout"
import ChangePasswordForm, { PasswordSubmitActionProps } from "@components/ChangePasswordForm"
import { Spacing } from "@common-ui/constants/spacing"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const CreatePasswordScreen = observer(
  function CreatePasswordScreen() {
    const router = useRouter()
    const navigation = useNavigation()

    const { authSessionStore } = useStores()

    const [successMessage, setSuccessMessage] = useState<string>("")

    const onSubmit = async (params: PasswordSubmitActionProps) => {
      await authSessionStore.createPassword({
        newPassword: params.newPassword,
      })

      if (authSessionStore.isError) return

      router.push({ pathname: ROUTES.UserChangeEmail })
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
          title={t("navigation.passwordCreateScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <ChangePasswordForm
            description="In order to change your email address, you must first create a password for your Floodzilla account."
            submitAction={onSubmit}
            submitActionText="Update"
            successMessage={successMessage}
            errorMessage={authSessionStore.errorMessage}
          />
        </Content>
      </Screen>
    )
  }
)

export default CreatePasswordScreen
