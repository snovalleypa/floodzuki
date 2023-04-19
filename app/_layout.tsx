import React from "react";
import { Slot, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { customFontsToLoad } from "@common-ui/constants/typography";
import { useInitialRootStore } from "@models/helpers/useStores";

import "@i18n/i18n";
import { t } from "@i18n/translate";
import { DatePickerProvider } from "@common-ui/contexts/DatePickerContext";
import { AssetsProvider } from "@common-ui/contexts/AssetsContext";

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
  Privacy = "/privacy",
  Terms = "/terms",
}

export const routes = {
  [ROUTES.Gages]: {
    path: ROUTES.Gages,
    icon: "activity",
    title: t("navigation.homeScreen")
  },
  [ROUTES.Forecast]: {
    path: ROUTES.Forecast,
    icon: "trending-up",
    title: t("navigation.forecastScreen")
  },
  [ROUTES.UserAlerts]: {
    path: ROUTES.UserAlerts,
    icon: "bell",
    title: t("navigation.profileScreen")
  },
}

export default function AppLayout() {
  const [areFontsLoaded] = useFonts(customFontsToLoad)
  const { rehydrated } = useInitialRootStore()

  if (!areFontsLoaded || !rehydrated) {
    return <SplashScreen />
  }

  return <App />;
}

function App() {
  return (
    <SafeAreaProvider>
      <BottomSheetModalProvider>
        <DatePickerProvider>
          <AssetsProvider>
            <Slot />
          </AssetsProvider>
        </DatePickerProvider>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  )
}
