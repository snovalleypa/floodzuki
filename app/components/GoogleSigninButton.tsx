import React, { useEffect } from "react"
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";

import { OutlinedButton } from "@common-ui/components/Button"
import { Cell } from "@common-ui/components/Common";
import { useStores } from "@models/helpers/useStores";
import { ROUTES } from "app/_layout";
import { If } from "@common-ui/components/Conditional";
import ErrorMessage from "@common-ui/components/ErrorMessage";
import { useGoogleAuth } from "@common-ui/contexts/GoogleAuthContext";
import { useLocale } from "@common-ui/contexts/LocaleContext";

const GoogleSigninButton = observer(
  function GoogleSigninButton() {
    const { authSessionStore } = useStores()
    const { t } = useLocale()
    const router = useRouter()
    const googleAuth = useGoogleAuth()

    useEffect(() => {      
      if (!!googleAuth.idToken) {
        authorizeUser(googleAuth.idToken)
      }
    }, [googleAuth.idToken])

    const authorizeUser = async (idToken: string) => {
      await authSessionStore.processGoogleToken({ idToken })

      if (!authSessionStore.isError) {
        router.push({ pathname: ROUTES.UserAlerts })
      }
    }

    return (
      <Cell>
        <If condition={googleAuth.isError}>
          <ErrorMessage errorText={t("googlesigninButton.error")} />
        </If>
        <OutlinedButton
          disabled={googleAuth.isDisabled}
          isLoading={googleAuth.isLoading}
          selfAlign="center"
          leftIcon="at-sign"
          type="lightBlue"
          title={t("googlesigninButton.title")}
          onPress={googleAuth.authorize}
        />
      </Cell>
    )
  }
)

export default GoogleSigninButton
