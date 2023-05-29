import React, { useEffect } from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { usePathname, useRouter, Slot, Link, Tabs } from "expo-router";
import Head from "expo-router/head";
import { Image } from "expo-image";

import '@expo/match-media';

import { If, Ternary } from "@common-ui/components/Conditional";
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
import { useCheckForUpdates } from "@services/expoUpdates";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import LocaleChange from "@components/LocaleChange";

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

  // Check for updates
  useCheckForUpdates()

  // Register for Push Notifications
  useRegisterPushNotificationsListener(store.authSessionStore.isPushNotificationsEnabled)

  return (
    <>
      <Ternary condition={isWeb}>
        <>
          {/** This is used to ensure that favicon is displayed on web */}
          <Head>
            <link rel="icon" href={getAsset("favicon").uri} />
            {/* Load custom fonts */}
            <link type="text/css" rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700|Open+Sans:300,400,500,600,700;lang=en" />
            <meta property="expo:handoff" content="true" />
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
          <Header />
          <Slot />
        </>
        <TabView />
      </Ternary>
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
    <Link href={href} asChild>
      <Pressable>
        {({ pressed, hovered }) => (
          <Cell horizontal={spacing}>
            <Title color={hovered ? Colors.primary : $color}>
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
  const { getAsset } = useAppAssets();

  const imageSize = 32
  const isActive = pathname.includes(route.path);
  
  const $color = isActive ? Colors.primary : Colors.darkGrey
  const $imageStyle = { width: imageSize, height: imageSize, marginBottom: -2, marginTop: -6 }

  return (
    <Link href={route.path} asChild>
      <Pressable>
        {({ pressed }) => (
          <Cell align="center">
            <Ternary condition={route.path === ROUTES.Gages}>
              <Image source={getAsset('favicon')} style={$imageStyle} />
              <Icon name={route?.icon} color={$color} />
            </Ternary>
            <LabelText color={pressed ? Colors.primary : $color}>
              {children}
            </LabelText>
          </Cell>
        )}
      </Pressable>
    </Link>
  );
}

function Header() {
  const { isMobile } = useResponsive();
  const { getAsset } = useAppAssets();
  const { t } = useLocale();

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
              {t(route.title)}
            </HeaderLink>
          ))}
        </Row>
        <If condition={!isMobile}>
          <Cell flex align="flex-end" right={Spacing.medium}>
            <LocaleChange />
          </Cell>
        </If>
      </Row>
      <Separator size={Spacing.micro} />
    </Cell>
  );
}

function TabBar() {
  const { bottom } = useSafeAreaInsets()
  const { t } = useLocale();

  const $bottomOffset = bottom ? bottom : Spacing.medium
  
  return (
    <Cell>
      <Separator size={Spacing.micro} />
      <Row top={Spacing.small} bottom={$bottomOffset} align="space-evenly" justify="center">
        {Object.values(routes).map(route => (
          <FooterLink key={route.path} route={route}>
            {t(route.title)}
          </FooterLink>
        ))}
      </Row>
    </Cell>
  );
}

function TabView() {
  const { t } = useLocale();

  return (
    <Tabs
      tabBar={(props) => <TabBar />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {Object.values(routes).map(route => (
        <Tabs.Screen
          key={route.path}
          name={route.tabName}
          options={{
            href: route.path,
          }}
        />
      ))}
    </Tabs>
  )
}
