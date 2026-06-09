import React, { useEffect } from "react";
import { ErrorBoundaryProps, Stack, useGlobalSearchParams } from "expo-router";
import PageTitle from "@common-ui/components/PageTitle";

import { observer } from "mobx-react-lite";

import { Content, Screen } from "@common-ui/components/Screen";
import { LargeTitle } from "@common-ui/components/Text";
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
import { useGoBack } from "@utils/useGoBack";
import { ROUTES } from "app/_layout";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import ForecastFooter from "@components/ForecastFooter";
import { Timing } from "@common-ui/constants/timing";
import Config from "@config/config";
import { ChainPager } from "@components/ChainPager";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const ForecastDetailsBody = observer(function ForecastDetailsBody({ gageId }: { gageId: string }) {
  const { t } = useLocale();
  const store = useStores();

  const { isMobile } = useResponsive();

  const fetchData = async () => {
    store.locationInfoStore.fetchData();
    store.forecastsStore.fetchData();
  };

  // Fetch data on mount
  useEffect(() => {
    if (store.isFetched) {
      fetchData();
    }
  }, [store.isFetched]);

  const goBack = useGoBack(ROUTES.Forecast);

  const forecastGage = store.getForecastGage(gageId);

  return (
    <Screen>
      <PageTitle name={forecastGage?.title ? `${forecastGage.title} Forecast` : undefined} />
      <Stack.Screen
        options={{
          title: `${t("common.title")} - ${t("forecastScreen.title")}: ${forecastGage?.title}`,
        }}
      />
      <Row left={Spacing.medium} bottom={Spacing.extraSmall} top={Spacing.medium}>
        <Ternary condition={isMobile}>
          <IconButton left={-Spacing.medium} icon="chevron-left" onPress={goBack} />
          <LinkButton
            left={-Spacing.medium}
            title={t("navigation.back")}
            leftIcon="chevron-left"
            textColor={Colors.blue}
            onPress={goBack}
          />
        </Ternary>
        <LargeTitle>{forecastGage?.title}</LargeTitle>
      </Row>
      <Content scrollable onRefresh={fetchData}>
        <If condition={!!forecastGage}>
          <ForecastChart gages={[forecastGage]} />
          <Cell top={isMobile ? Spacing.small : Spacing.tiny}>
            <GageSummaryCard firstItem noDetails gage={forecastGage} />
          </Cell>
          <Cell top={isMobile ? Spacing.small : Spacing.mediumXL}>
            <ExtendedGageSummaryCard gage={forecastGage} />
          </Cell>
          <ForecastFooter />
        </If>
      </Content>
    </Screen>
  );
});

const ForecastDetailsScreen = observer(function ForecastDetailsScreen() {
  const { id } = useGlobalSearchParams();
  const { isMobile } = useResponsive();

  // Pathname id can either be a simple gauge like "USGS-38"
  // or a metagauge like "USGS-SF17/USGS-NF10/USGS-MF11", which will be
  // represented as an array of strings ["USGS-SF17", "USGS-NF10", "USGS-MF11"]
  const gageId = Array.isArray(id) ? id.join("/") : id;

  const [hidden, setHidden] = React.useState(isMobile ? true : false);

  useTimeout(() => {
    setHidden(false);
  }, Timing.zero);

  if (hidden || !gageId) {
    return null;
  }

  const pages = Config.FORECAST_GAGE_IDS.map((forecastId) => ({
    key: forecastId,
    route: { pathname: ROUTES.ForecastDetails, params: { id: forecastId.split("/") } },
    render: () => <ForecastDetailsBody gageId={forecastId} />,
  }));

  const initialIndex = pages.findIndex((p) => p.key === gageId);

  if (initialIndex === -1) {
    return <ForecastDetailsBody gageId={gageId} />;
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false, animation: "none" }} />
      <ChainPager pages={pages} initialIndex={initialIndex} />
    </>
  );
});

export default ForecastDetailsScreen;
