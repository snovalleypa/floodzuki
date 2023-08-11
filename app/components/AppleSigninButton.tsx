import React, { useEffect } from 'react'
import * as AppleAuthentication from 'expo-apple-authentication';

export const AppleSigninButton = () => {
  const [isAvailable, setIsAvailable] = React.useState(false)
  const [credentials, setCredentials] = React.useState<AppleAuthentication.AppleAuthenticationCredential | null>(null)

  useEffect(() => {
    const checkAvilability = async () => {
      const isAvailable = await AppleAuthentication.isAvailableAsync()

      setIsAvailable(isAvailable)
    }

    checkAvilability()
  }, [])

  if (!isAvailable) {
    return null
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={{ width: 200, height: 44 }}
      onPress={async () => {
        try {
          const credentials = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          console.log("credential", credentials)

          setCredentials(credentials)

          // signed in
        } catch (e) {
          if (e.code === 'ERR_CANCELED') {
            // handle that the user canceled the sign-in flow
          } else {
            // handle other errors
          }
        }
      }}
    />
  )
}