import React, { useContext, createContext, useState, useEffect, useMemo, useCallback } from "react"

import Constants from "expo-constants";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from "expo-auth-session";

import { isAndroid, isWeb } from "@common-ui/utils/responsive";
import { logError } from "@utils/sentry";

WebBrowser.maybeCompleteAuthSession();

const requestConfig: Partial<Google.GoogleAuthRequestConfig> = {
  scopes: ["profile", "email"],
  selectAccount: true,
  webClientId: Constants.expoConfig.extra.googleOAuthWebClientId,
  androidClientId: Constants.expoConfig.extra.googleOAuthAndroidClientId,
  iosClientId: Constants.expoConfig.extra.googleOAuthIOSClientId,
  expoClientId: Constants.expoConfig.extra.googleOAuthExpoClientId,
}

type GoogleAuthContextType = {
  isDisabled: boolean;
  isLoading: boolean;
  isError: boolean;
  idToken: string;
  authorize: () => Promise<void>
}

const initialState = {
  isDisabled: true,
  isLoading: false,
  isError: false,
  idToken: "",
  authorize: async () => {}
}

const GoogleAuthContext = createContext<GoogleAuthContextType>(initialState)

export const useGoogleAuth = () => useContext(GoogleAuthContext)

export const GoogleAuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [idToken, setIdToken] = useState("")

  if (isWeb) {
    requestConfig.clientSecret = Constants.expoConfig.extra.googleOauthClientSecret
  }

  if (isAndroid) {
    requestConfig.redirectUri = makeRedirectUri({
      scheme: 'com.floodzilla.floodzuki',
      path: "user/login",
      isTripleSlashed: true,
      useProxy: false,
    })
  }

  const [request, response, promptAsync] = Google.useAuthRequest(
    requestConfig,
    {
      useProxy: false
    }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken } = response?.authentication;

      setIdToken(idToken)
    }
    else if (response?.type === 'error') {
      logError(response, "GoogleSigninButton.responseType")
      setIsError(true)
    }
  }, [response])

  const authorize = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      await promptAsync()
    }
    catch (error) {
      logError(error, "GoogleSigninButton.authorizeUser")
      setIsError(true)
    }
    finally {
      setIsLoading(false)
    }
  }, [promptAsync])

  const values = useMemo(() => ({
    isDisabled: !request,
    isLoading,
    isError,
    idToken,
    authorize
  }), [request, isLoading, isError, idToken, authorize])

  return (
    <GoogleAuthContext.Provider value={values}>
      {children}
    </GoogleAuthContext.Provider>
  )
}