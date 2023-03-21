import React from "react";
import { Platform, View } from "react-native";
import { Tabs, usePathname, Slot, Link, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { If } from "@common-ui/components/Conditional";
import { customFontsToLoad } from "@common-ui/constants/typography";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { ROUTES } from "app/_layout";

export default function AppLayout() {
  return (
    <>
      <If condition={Platform.OS === "web"}>
        <Header />
      </If>
      <Slot />
      <If condition={Platform.OS !== "web"}>
        <TabBar />
      </If>
    </>
  )
}

function HeaderLink({ href, children }) {
  const pathname = usePathname();

  const isActive = pathname === href;
  const $style = isActive ? { color: Colors.primary } : {}

  return <Link href={href} style={$style}>{children}</Link>;
}

function Header() {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <HeaderLink href={ROUTES.Home}>Home</HeaderLink>
      <HeaderLink href={ROUTES.Forecast}>Forecast</HeaderLink>
      <HeaderLink href={ROUTES.Profile}>Profile</HeaderLink>
    </View>
  );
}

function TabBar() {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", height: Spacing.extraLarge }}>
      <HeaderLink href={ROUTES.Home}>Home</HeaderLink>
      <HeaderLink href={ROUTES.Forecast}>Forecast</HeaderLink>
      <HeaderLink href={ROUTES.Profile}>Profile</HeaderLink>
    </View>
  );
}
