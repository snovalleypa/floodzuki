import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { usePathname, Slot, Link } from "expo-router";

import { If } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { ROUTES } from "app/_layout";
import { useStores } from "@models/helpers/useStores";
import { useInterval } from "@utils/useTimeout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LabelText, SmallTitle } from "@common-ui/components/Text";
import { Cell, Row } from "@common-ui/components/Common";

export default function AppLayout() {
  const store = useStores()

  useEffect(() => {
    store.fetchMainData()
  }, [])

  // Update gage status every 5 minutes
  useInterval(() => {
    store.gagesStore.fetchData()
  }, 5 * 60 * 1000)

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
  const $color = isActive ? Colors.primary : Colors.lightDark

  return (
    <Link href={href}>
      <View className="p-2 pl-4 pr-4">
        <SmallTitle color={$color}>
          {children}
        </SmallTitle>
      </View>
    </Link>
  );
}

function FooterLink({ href, children }) {
  const pathname = usePathname();

  const isActive = href === "/" ? pathname === href : pathname.includes(href);
  const $color = isActive ? Colors.primary : Colors.darkGrey

  return (
    <Link href={href}>
      <View className="p-2 pl-4 pr-4">
        <LabelText color={$color}>
          {children}
        </LabelText>
      </View>
    </Link>
  );
}

function Header() {
  return (
    <View className="pt-2 border-b border-solid border-slate-200">
      <View className="flex-row">
        <Row flex top={Spacing.medium} bottom={Spacing.medium} align="space-evenly" justify="center">
          <HeaderLink href={ROUTES.Home}>Home</HeaderLink>
          <HeaderLink href={ROUTES.Forecast}>Forecast</HeaderLink>
          <HeaderLink href={ROUTES.Profile}>Profile</HeaderLink>
        </Row>
      </View>
    </View>
  );
}

function TabBar() {
  const { bottom } = useSafeAreaInsets()

  const marginBottom = bottom > 0 ? Math.floor(bottom/4) : "2"
  
  return (
    <View className={`pt-2 border-t border-solid border-slate-200`}>
      <View className={`m-auto flex-row space-evenly mb-${marginBottom}`}>
        <FooterLink href={ROUTES.Home}>Home</FooterLink>
        <FooterLink href={ROUTES.Forecast}>Forecast</FooterLink>
        <FooterLink href={ROUTES.Profile}>Profile</FooterLink>
      </View>
    </View>
  );
}
