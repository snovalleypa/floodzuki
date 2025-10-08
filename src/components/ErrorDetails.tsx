import React, { useEffect } from "react"
import { ErrorBoundaryProps } from "expo-router"

import * as Sentry from "@sentry/react-native";

import { Screen, Content } from "@common-ui/components/Screen"
import { HugeTitle, LargeTitle, MediumText } from "@common-ui/components/Text"
import { SolidButton } from "@common-ui/components/Button"
import { Cell } from "@common-ui/components/Common"
import { Spacing } from "@common-ui/constants/spacing"
import { useLocale } from "@common-ui/contexts/LocaleContext"
import { isWeb } from "@common-ui/utils/responsive"

export function ErrorDetails(props: ErrorBoundaryProps) {
  const { t } = useLocale();

  // Track error with sentry when loaded
  useEffect(() => {
    if (isWeb) {
      Sentry.Browser?.captureException(props.error);
      return;
    }
    
    Sentry.Native?.captureException(props.error);
  }, [])
  
  return (
    <Screen>
      <Cell left={Spacing.medium}>
        <HugeTitle text={t("errorScreen.header")} />
      </Cell>
      <Content>
        <Cell flex align="center">
          <Cell bottom={Spacing.medium}>
            <LargeTitle text={t("errorScreen.title")} />
          </Cell>
          <MediumText align="center" text={t("errorScreen.friendlySubtitle")} />
        </Cell>

        <Cell align="center">
          <SolidButton selfAlign="center" onPress={props.retry} title={t("errorScreen.reset")} />
        </Cell>
      </Content>
    </Screen>
  )
}
