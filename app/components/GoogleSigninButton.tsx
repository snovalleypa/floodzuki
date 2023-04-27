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

const GoogleSigninButton = observer(
  function GoogleSigninButton() {
    const { authSessionStore } = useStores()
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
          <ErrorMessage errorText="Something went wrong. Please try again." />
        </If>
        <OutlinedButton
          disabled={googleAuth.isDisabled}
          isLoading={googleAuth.isLoading}
          selfAlign="center"
          leftIcon="at-sign"
          type="lightBlue"
          title="Sign in with Google"
          onPress={googleAuth.authorize}
        />
      </Cell>
    )
  }
)

export default GoogleSigninButton
