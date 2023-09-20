import React, { useEffect } from "react"
import { ErrorBoundaryProps, useSearchParams, Stack, useRouter, useNavigation } from "expo-router";
import Head from "expo-router/head";

import { observer } from "mobx-react-lite";

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { ExtendedGageSummaryCard, GageSummaryCard } from "@components/GageSummaryCard";
import { Cell, Row } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";
import { isAndroid, useResponsive } from "@common-ui/utils/responsive";
import { IconButton, LinkButton } from "@common-ui/components/Button";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { useTimeout } from "@utils/useTimeout";
import { ROUTES } from "app/_layout";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import ForecastFooter from "@components/ForecastFooter";
import { Timing } from "@common-ui/constants/timing";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ForecastDetailsScreen = observer(
  function ForecastDetailsScreen() {
    const { id } = useSearchParams()
    const { t } = useLocale();
    const router = useRouter()
    const navigation = useNavigation()
    const store = useStores()

    const { isMobile } = useResponsive()

    // Pathname id can either be a simple gage like "USGS-38"
    // or a nested gage like "USGS-SF17/USGS-38-0001" which will be
    // represented as an array of strings ["USGS-SF17", "USGS-38-0001"]
    const gageId = Array.isArray(id) ? id.join("/") : id

    const [hidden, setHidden] = React.useState(isMobile ? true : false)

    // Fetch data on mount
    useEffect(() => {
      if (store.isFetched)  {
        store.forecastsStore.fetchData()
      }
    }, [store.isFetched])

    useTimeout(() => {
      setHidden(false)
    }, Timing.zero)

    const goBack = () => {
      navigation.canGoBack() ?
        navigation.goBack() :
        router.push({ pathname: ROUTES.Forecast })
    }

    const forecastGage = hidden ? undefined : store.getForecastGage(gageId)

    return (
      <Screen>
        <Head>
          <title>{t("common.title")} - {t("forecastScreen.title")}</title>
        </Head>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("forecastScreen.title")}: ${forecastGage?.title}` }} />
        <Row left={Spacing.medium} bottom={Spacing.extraSmall} top={Spacing.medium}>
          <Ternary condition={isMobile}>
            <IconButton
              left={-Spacing.medium}
              icon="chevron-left"
              onPress={goBack} />
            <LinkButton
              left={-Spacing.medium}
              title={t("navigation.back")}
              leftIcon="chevron-left"
              textColor={Colors.blue}
              onPress={goBack}
            />
          </Ternary>
          <LargeTitle>
            {forecastGage?.title}
          </LargeTitle>
        </Row>
        <Content scrollable>
          <If condition={!!forecastGage}>
            <ForecastChart gages={[forecastGage]} />
            <Cell top={Spacing.mediumXL}>
              <GageSummaryCard
                firstItem
                noDetails
                gage={forecastGage}
              />
            </Cell>
            <Cell top={Spacing.mediumXL}>
              <ExtendedGageSummaryCard gage={forecastGage} />
            </Cell>
            <ForecastFooter />
          </If>
        </Content>
      </Screen>
    )
  }
)

export default ForecastDetailsScreen
