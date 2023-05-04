import React from "react";
import { Slot, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { customFontsToLoad } from "@common-ui/constants/typography";
import { useInitialRootStore } from "@models/helpers/useStores";

import { DatePickerProvider } from "@common-ui/contexts/DatePickerContext";
import { AssetsProvider } from "@common-ui/contexts/AssetsContext";
import { isWeb } from "@common-ui/utils/responsive";
import { GoogleAuthProvider } from "@common-ui/contexts/GoogleAuthContext";
import { LocaleProvider } from "@common-ui/contexts/LocaleContext";

/**
 * Root layout for Expo router (entry file for the app)
 * 
 */

// All routes available in the app
export enum ROUTES {
  Home = "/",
  Forecast = "/forecast",
  ForecastDetails = "/forecast/[...id]",
  Gages = "/gages",
  GageDetails = "/gages/[id]",
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
    tabName: "gages",
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
              </GoogleAuthProvider>
            </AssetsProvider>
          </DatePickerProvider>
        </BottomSheetModalProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  )
}
