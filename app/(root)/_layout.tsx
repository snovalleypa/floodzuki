import React, { useEffect } from "react";
import { Platform } from "react-native";
import { usePathname, Slot, Link } from "expo-router";

import '@expo/match-media';

import { If } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { ROUTES } from "app/_layout";
import { useStores } from "@models/helpers/useStores";
import { useInterval } from "@utils/useTimeout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LabelText, SmallTitle } from "@common-ui/components/Text";
import { Cell, Row, Separator } from "@common-ui/components/Common";

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
      <Cell>
        <SmallTitle color={$color}>
          {children}
        </SmallTitle>
      </Cell>
    </Link>
  );
}

function FooterLink({ href, children }) {
  const pathname = usePathname();

  const isActive = href === "/" ? pathname === href : pathname.includes(href);
  const $color = isActive ? Colors.primary : Colors.darkGrey

  return (
    <Link href={href}>
      <Cell>
        <LabelText color={$color}>
          {children}
        </LabelText>
      </Cell>
    </Link>
  );
}

function Header() {
  return (
    <Cell>
      <Row top={Spacing.medium} bottom={Spacing.medium} align="space-evenly" justify="center">
        <HeaderLink href={ROUTES.Home}>Home</HeaderLink>
        <HeaderLink href={ROUTES.Forecast}>Forecast</HeaderLink>
        <HeaderLink href={ROUTES.Profile}>Profile</HeaderLink>
      </Row>
      <Separator size={Spacing.micro} />
    </Cell>
  );
}

function TabBar() {
  const { bottom } = useSafeAreaInsets()

  const $bottomOffset = bottom ? bottom + Spacing.small : Spacing.medium
  
  return (
    <Cell>
      <Separator size={Spacing.micro} />
      <Row top={Spacing.medium} bottom={$bottomOffset} align="space-evenly" justify="center">
        <FooterLink href={ROUTES.Home}>Home</FooterLink>
        <FooterLink href={ROUTES.Forecast}>Forecast</FooterLink>
        <FooterLink href={ROUTES.Profile}>Profile</FooterLink>
      </Row>
    </Cell>
  );
}
