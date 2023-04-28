import React, { useEffect } from "react";
import { Pressable } from "react-native";
import { usePathname, Slot, Link } from "expo-router";
import Head from "expo-router/head";
import { Image } from "expo-image";
import { t } from "@i18n/translate";

import '@expo/match-media';

import { If } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { MainRoute, ROUTES, routes } from "app/_layout";
import { useStores } from "@models/helpers/useStores";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LabelText, LargeTitle, RegularLargeText, SmallerText, SmallText, TinyText } from "@common-ui/components/Text";
import { Cell, Row, Separator } from "@common-ui/components/Common";
import Icon from "@common-ui/components/Icon";
import { isWeb, useResponsive } from "@common-ui/utils/responsive";
import { openLinkInBrowser } from "@utils/navigation";
import { useAppAssets } from "@common-ui/contexts/AssetsContext";
import { useRegisterPushNotificationsListener } from "@services/pushNotifications";

// Main App Layout
export default function AppLayout() {
  const store = useStores()
  const { getAsset } = useAppAssets();

  // Fetch data on app start
  useEffect(() => {
    store.fetchMainData()

    if (store.authSessionStore.isLoggedIn) {
      store.authSessionStore.reauthenticate()
    }
  }, [])

  // Register for Push Notifications
  useRegisterPushNotificationsListener()

  return (
    <>
      <If condition={isWeb}>
        <Header />
        {/** This is used to ensure that favicon is displayed on web */}
        <Head>
          <link rel="icon" href={getAsset("favicon").uri} />
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=UA-302444-12"
          ></script>
          <script src="//apis.google.com/js/client:platform.js?onload=start"></script>
          <script src="//www.google.com/recaptcha/api.js" async defer></script>
          <script>{`
            window.dataLayer = window.dataLayer || [];
            
            function gtag() {
              dataLayer.push(arguments)
            }
            
            gtag("js", new Date())

            gtag("config", "UA-302444-12")
          `}
          </script>
        </Head>
      </If>
      <Slot />
      <If condition={!isWeb}>
        <TabBar />
      </If>
    </>
  )
}

function HeaderLink({ href, children }) {
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const isActive = pathname.includes(href);
  const $color = isActive ? Colors.primary : Colors.lightDark

  const Title = isMobile ? LabelText : LargeTitle
  const spacing = isMobile ? Spacing.small : Spacing.large

  return (
    <Link asChild href={href}>
      <Pressable>
        {({ pressed, hovered }) => (
          <Cell horizontal={spacing}>
            <Title
              color={hovered ? Colors.primary : $color}
            >
              {children}
            </Title>
          </Cell>
        )}
      </Pressable>
    </Link>
  );
}

function FooterLink({ route, children }: { route: MainRoute, children: string }) {
  const pathname = usePathname();

  const isActive = pathname.includes(route.path);
  const $color = isActive ? Colors.primary : Colors.darkGrey

  return (
    <Link href={route.path}>
      <Cell align="center">
        <Icon name={route?.icon} color={$color} />
        <LabelText color={$color}>
          {children}
        </LabelText>
      </Cell>
    </Link>
  );
}

function Header() {
  const { isMobile } = useResponsive();
  const { getAsset } = useAppAssets();

  const openSVPA = () => {
    openLinkInBrowser("https://svpa.us/floodzilla-gage-network/")
  }

  const Title = isMobile ? SmallText : RegularLargeText
  const Subtitle = isMobile ? TinyText : SmallerText

  const imageSize = isMobile ? 36 : 40
  const offsetLeft = isMobile ? Spacing.extraSmall : Spacing.medium
  const $imageStyle = { width: imageSize, height: imageSize }

  return (
    <Cell>
      <Row
        top={Spacing.small}
        bottom={Spacing.small}
        align="space-between"
        justify="center"
      >
        <Row flex left={Spacing.small}>
          <Image source={getAsset('logo')} style={$imageStyle} />
          <Cell left={offsetLeft} flex>
            <Link href={ROUTES.Home}>
              <Title>{t("common.title")}</Title>
            </Link>
            <Pressable onPress={openSVPA}>
              <Subtitle muted>{t("common.subtitle")}</Subtitle>
            </Pressable>
          </Cell>
        </Row>
        <Row flex align="center" right={Spacing.mediumXL}>
          {Object.values(routes).map(route => (
            <HeaderLink key={route.path} href={route.path}>
              {route.title}
            </HeaderLink>
          ))}
        </Row>
        <If condition={!isMobile}>
          <Cell flex />
        </If>
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
        {Object.values(routes).map(route => (
          <FooterLink key={route.path} route={route}>
            {route.title}
          </FooterLink>
        ))}
      </Row>
    </Cell>
  );
}
