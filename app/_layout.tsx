import React from "react";
import { Slot, SplashScreen } from "expo-router";
import * as Sentry from 'sentry-expo';
import { useFonts } from "expo-font";
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { customFontsToLoad } from "@common-ui/constants/typography";
import { useInitialRootStore } from "@models/helpers/useStores";

import { DatePickerProvider } from "@common-ui/contexts/DatePickerContext";
import { AssetsProvider } from "@common-ui/contexts/AssetsContext";
import { isWeb } from "@common-ui/utils/responsive";
import { GoogleAuthProvider } from "@common-ui/contexts/GoogleAuthContext";
import { LocaleProvider } from "@common-ui/contexts/LocaleContext";


Sentry.init({
  dsn: "https://7580ac526eb64f2f811ba952bb9409f1@o4505126543360000.ingest.sentry.io/4505132726681600",
  enableInExpoDevelopment: false,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

/**
 * Root layout for Expo router (entry file for the app)
 * 
 */

// All routes available in the app
export enum ROUTES {
  Home = "/",
  Forecast = "/forecast",
  ForecastDetails = "/forecast/[...id]",
  Gages = "/gage",
  GageDetails = "/gage/[id]",
  UserAlerts = "/user/alerts",
  UserProfile = "/user/profile",
  UserLogin = "/user/login",
  UserPasswordForgot = "/user/passwordForgot",
  UserSetPassword = "/user/setpassword",
  UserResetPassword = "/user/resetpassword",
  UserCreatePassword = "/user/createpassword", // Not currently used
  UserVerifyPhoneNumber = "/user/verifyPhoneNumber",
  UserVerifyEmail = "/user/verifyemail",
  UserUnsubscribe = "/user/unsubscribe",
  UserChangeEmail = "/user/changeemail", // Not currently used
  UserNew = "/user/new",
  About = "/user",
  Privacy = "/user/privacy",
  Terms = "/user/terms",
}

export const routes = {
  [ROUTES.Gages]: {
    path: ROUTES.Gages,
    icon: "activity",
    tabName: "gage",
    title: "navigation.homeScreen"
  },
  [ROUTES.Forecast]: {
    path: ROUTES.Forecast,
    icon: "trending-up",
    tabName: "forecast",
    title: "navigation.forecastScreen"
  },
  [ROUTES.UserAlerts]: {
    path: ROUTES.About,
    icon: "bell",
    tabName: "user",
    title: "navigation.alertsScreen"
  },
} as const;

export type MainRoute = typeof routes[keyof typeof routes];

export default function AppLayout() {
  const [areFontsLoaded] = useFonts(customFontsToLoad)
  const { rehydrated } = useInitialRootStore()

  const delayForAssets = isWeb ? false : !areFontsLoaded

  if (delayForAssets || !rehydrated) {
    return <SplashScreen />
  }

  return <App />;
}

function App() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <BottomSheetModalProvider>
          <DatePickerProvider>
            <AssetsProvider>
              <GoogleAuthProvider>
                  <Slot />
                  <StatusBar style="dark" />
              </GoogleAuthProvider>
            </AssetsProvider>
          </DatePickerProvider>
        </BottomSheetModalProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  )
}
