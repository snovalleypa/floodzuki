import React, { useEffect } from 'react'
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';

import { useStores } from '@models/helpers/useStores';
import { ROUTES } from 'app/_layout';
import { useLocale } from '@common-ui/contexts/LocaleContext';
import { If } from '@common-ui/components/Conditional';
import ErrorMessage from '@common-ui/components/ErrorMessage';
import { logError } from '@utils/sentry';

export const AppleSigninButton = () => {
  const { authSessionStore } = useStores()
  const { t } = useLocale()
  const router = useRouter()
  
  const [isAvailable, setIsAvailable] = React.useState(false)
  const [isError, setIsError] = React.useState(false)

  useEffect(() => {
    const checkAvilability = async () => {
      const isAvailable = await AppleAuthentication.isAvailableAsync()

      setIsAvailable(isAvailable)
    }

    checkAvilability()
  }, [])

  const authorizeUser = async () => {
    setIsError(false)
    
    try {
      const credentials = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      await authSessionStore.processAppleToken({
        idToken: credentials.identityToken,
        firstName: credentials.fullName?.givenName ?? "",
        lastName: credentials.fullName?.familyName ?? "",
      })

      if (authSessionStore.isError) {
        throw new Error(authSessionStore.errorMessage)
      }

      router.push({ pathname: ROUTES.UserAlerts })
    }
    catch (error) {
      logError(error, "AppleSigninButton.authorizeUser")

      setIsError(true)
    }
  }

  if (!isAvailable) {
    return null
  }

  return (
    <>
      <If condition={isError}>
        <ErrorMessage errorText={t("googlesigninButton.error")} />
      </If>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
        cornerRadius={5}
        style={{ width: 200, height: 44 }}
        onPress={authorizeUser}
      />
    </>
  )
}