import React, { useEffect } from "react";
import { Platform } from "react-native";
import { usePathname, Slot, Link } from "expo-router";

import '@expo/match-media';

import { If } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { routes } from "app/_layout";
import { useStores } from "@models/helpers/useStores";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LabelText, LargeTitle } from "@common-ui/components/Text";
import { Cell, Row, Separator } from "@common-ui/components/Common";
import Icon from "@common-ui/components/Icon";

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
  const $color = isActive ? Colors.primary : Colors.lightDark

  return (
    <Link href={href}>
      <Cell horizontal={Spacing.large}>
        <LargeTitle color={$color}>
          {children}
        </LargeTitle>
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
      <Cell align="center">
        <Icon name={routes[href].icon} color={$color} />
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
      <Row top={Spacing.medium} bottom={Spacing.medium} align="center" justify="center">
        {Object.keys(routes).map(route => (
          <HeaderLink key={route} href={routes[route].path}>
            {routes[route].title}
          </HeaderLink>
        ))}
      </Row>
      <Separator size={Spacing.micro} />
    </Cell>
  );
}

function TabBar() {
  const { bottom } = useSafeAreaInsets()

  const $bottomOffset = bottom ? bottom : Spacing.medium
  
  return (
    <Cell>
      <Separator size={Spacing.micro} />
      <Row top={Spacing.medium} bottom={$bottomOffset} align="space-evenly" justify="center">
        {Object.keys(routes).map(route => (
          <FooterLink key={route} href={routes[route].path}>
            {routes[route].title}
          </FooterLink>
        ))}
      </Row>
    </Cell>
  );
}
