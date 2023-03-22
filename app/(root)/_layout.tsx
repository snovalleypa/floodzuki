import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { usePathname, Slot, Link } from "expo-router";

import { If } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { ROUTES } from "app/_layout";
import { useStores } from "@models/helpers/useStores";

export default function AppLayout() {
  const store = useStores()

  useEffect(() => {
    store.fetchMainData()
  }, [])

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

  const isActive = href === "/" ? pathname === href : pathname.includes(href);
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
