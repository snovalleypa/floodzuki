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

/**
 * Root layout for Expo router (entry file for the app)
 * 
 */

// All routes available in the app
export enum ROUTES {
  Home = "/",
  Forecast = "/forecast",
  ForecastDetails = "/forecast/[...id]",
  Profile = "/profile",
  GageDetails = "/gage/[id]",
}

export const routes = {
  [ROUTES.Home]: {
    path: ROUTES.Home,
    icon: "home",
    title: t("navigation.homeScreen")
  },
  [ROUTES.Forecast]: {
    path: ROUTES.Forecast,
    icon: "trending-up",
    title: t("navigation.forecastScreen")
  },
  [ROUTES.Profile]: {
    path: ROUTES.Profile,
    icon: "user",
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
          <Slot />
        </DatePickerProvider>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  )
}
