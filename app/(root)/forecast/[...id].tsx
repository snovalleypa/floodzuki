import React, { useEffect } from "react";
import { ErrorBoundaryProps, Stack, useGlobalSearchParams, useRouter } from "expo-router";
import PageTitle from "@common-ui/components/PageTitle";

import { observer } from "mobx-react-lite";

import { Content, Screen } from "@common-ui/components/Screen";
import { LargeTitle } from "@common-ui/components/Text";
import { ErrorDetails } from "@components/ErrorDetails";
import { ForecastChart } from "@components/ForecastChart";
import { ExtendedGageSummaryCard, GageSummaryCard } from "@components/GageSummaryCard";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { Spacing } from "@common-ui/constants/spacing";

import { useStores } from "@models/helpers/useStores";
import { isAndroid, useResponsive } from "@common-ui/utils/responsive";
import { IconButton, LinkButton } from "@common-ui/components/Button";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Colors } from "@common-ui/constants/colors";
import { useTimeout } from "@utils/useTimeout";
import { useGoBack } from "@utils/useGoBack";
import { findForecastGroup } from "@utils/forecastGroups";
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

const ForecastDetailsBody = observer(function ForecastDetailsBody({
  gageId,
  backRoute,
}: {
  gageId: string;
  // Fallback destination for the back button; the forecast screen passes the
  // fork group's metagage route so fork pages return to "Sum of Forks".
  backRoute?: { pathname: string; params: Record<string, any> | undefined };
}) {
  const { t } = useLocale();
  const store = useStores();
  const router = useRouter();

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

  const goBack = useGoBack(backRoute?.pathname ?? ROUTES.Forecast, backRoute?.params);

  const forecastGage = store.getForecastGage(gageId);

  const forkIds = forecastGage?.isMetagage ? Config.FORECAST_METAGAGE_COMPONENTS[gageId] ?? [] : [];
  const forkGages = store.getForecastGages(forkIds);

  // Metagage chart: sum line + each fork; draw the metagage's own flood-stage line.
  const singleGage = forecastGage && !forecastGage.isMetagage ? [forecastGage] : [];
  const chartGages = forecastGage?.isMetagage ? [forecastGage, ...forkGages] : singleGage;
  // "Forks" matches the existing hardcoded label in getFloodStageLabel.
  const floodLineOverride = forecastGage?.isMetagage ? { gageId, label: "Forks" } : undefined;

  return (
    <Screen>
      <PageTitle
        name={
          forecastGage?.title
            ? `${forecastGage.title} ${t("navigation.forecastScreen")}`
            : undefined
        }
      />
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
          <ForecastChart gages={chartGages} floodLineOverride={floodLineOverride} />
          <Cell top={isMobile ? Spacing.small : Spacing.tiny}>
            <GageSummaryCard firstItem noDetails gage={forecastGage} />
          </Cell>
          <Cell top={isMobile ? Spacing.small : Spacing.mediumXL}>
            <ExtendedGageSummaryCard gage={forecastGage} />
          </Cell>
          <If condition={forkGages.length > 0}>
            <Cell top={isMobile ? Spacing.small : Spacing.mediumXL}>
              <LargeTitle>{t("forecastScreen.forksSectionTitle")}</LargeTitle>
            </Cell>
            <RowOrCell flex align="flex-start" justify="stretch" top={Spacing.medium}>
              {forkGages.map((fork, i) => (
                <GageSummaryCard
                  firstItem={i === 0}
                  key={fork.id}
                  gage={fork}
                  onPress={() =>
                    router.push({
                      pathname: ROUTES.ForecastDetails,
                      params: { id: [fork.id] },
                    })
                  }
                />
              ))}
            </RowOrCell>
          </If>
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
  // or a metagauge like "USGS-SF17/USGS-NF10/USGS-MF11", which arrives as an
  // array of segments ["USGS-SF17", "USGS-NF10", "USGS-MF11"].
  const gageId = Array.isArray(id) ? id.join("/") : id;

  const [hidden, setHidden] = React.useState(isMobile ? true : false);

  useTimeout(() => {
    setHidden(false);
  }, Timing.zero);

  if (hidden || !gageId) {
    return null;
  }

  // findForecastGroup takes routes by injection (forecastGroups.ts has no
  // app/_layout dependency); pass the ROUTES enum already imported in this file.
  const group = findForecastGroup(gageId, ROUTES);

  // Unknown id (not a top-level forecast or a known fork) -> standalone page.
  if (!group) {
    return <ForecastDetailsBody gageId={gageId} />;
  }

  const pages = group.ids.map((forecastId) => ({
    key: forecastId,
    route: { pathname: ROUTES.ForecastDetails, params: { id: forecastId.split("/") } },
    render: () => <ForecastDetailsBody gageId={forecastId} backRoute={group.backRoute} />,
  }));

  const initialIndex = pages.findIndex((p) => p.key === gageId);

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false, animation: "none" }} />
      <ChainPager pages={pages} initialIndex={initialIndex} />
    </>
  );
});

export default ForecastDetailsScreen;
