import React from "react";
import { Slot, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { customFontsToLoad } from "@common-ui/constants/typography";
import { useInitialRootStore } from "@models/helpers/useStores";

/**
 * Root layout for Expo router (entry file for the app)
 * 
 */

// All routes available in the app
export enum ROUTES {
  Home = "/",
  Forecast = "/forecast",
  Profile = "/profile",
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
      <Slot />
    </SafeAreaProvider>
  )
}
