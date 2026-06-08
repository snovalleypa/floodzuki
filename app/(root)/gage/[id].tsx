import React, { useContext, useState } from "react";
import { TouchableOpacity } from "react-native";
import { ErrorBoundaryProps, Link, Stack, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";

import { observer } from "mobx-react-lite";

import { IconButton, LinkButton } from "@common-ui/components/Button";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Label } from "@common-ui/components/Label";
import { Content, Screen } from "@common-ui/components/Screen";
import { LabelText, LargeTitle, MediumTitle, RegularText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import {
  MobileScreen,
  WideScreen,
  isMobile,
  isWeb,
  useResponsive,
} from "@common-ui/utils/responsive";

import { useStores } from "@models/helpers/useStores";
import { Gage } from "@models/Gage";

import { ChainPager, ChainPagerContext } from "@components/ChainPager";
import { ErrorDetails } from "@components/ErrorDetails";
import { GageDetailsChart } from "@components/GageDetailsChart";
import CalloutReadingCard from "@components/CalloutReadingCard";
import GageImageCard from "@components/GageImageCard";
import GageInfoCard from "@components/GageInfoCard";
import StatusLevelsCard from "@components/StatusLevelsCard";

import { ROUTES } from "app/_layout";
import Icon from "@common-ui/components/Icon";
import { Card } from "@common-ui/components/Card";
import EmptyComponent from "@common-ui/components/EmptyComponent";
import GageMap from "@components/GageMap";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useTimeout } from "@utils/useTimeout";
import { useGoBack } from "@utils/useGoBack";
import { Timing } from "@common-ui/constants/timing";

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

type GageLinkProps = {
  gage: Gage;
  simple?: boolean;
};

const UpstreamGageLink = observer(function UpstreamGageLink({ gage, simple }: GageLinkProps) {
  const { getUpstreamGageLocation } = useStores();
  const { t } = useLocale();
  const { isMobile } = useResponsive();
  const pager = useContext(ChainPagerContext);
  // Carry forward date-range / event params so navigating to a neighboring
  // gauge keeps the user's selected view (matches the native pager behavior,
  // where router.setParams merges into the existing route).
  const currentParams = useLocalSearchParams();

  const upstreamGageLocation = getUpstreamGageLocation(gage?.locationId);

  if (!upstreamGageLocation) {
    return <Cell />;
  }

  const title = simple ? t("gageScreen.upstreamGage") : t("gageScreen.goToUpstreamGage");
  const iconSize = isMobile && simple ? 16 : 24;
  const Text = isMobile && simple ? LabelText : RegularText;
  // Mobile: claim half the row so the inner Card and Cell have width to expand
  // into. Wide: leave undefined so React Native Web doesn't collapse the
  // TouchableOpacity to zero width via CSS `flex: 0` shorthand semantics.
  const touchableStyle = isMobile ? { flex: 1 } : undefined;

  const innerCard = (
    <Card>
      <Row>
        <Icon name="arrow-left" size={iconSize} color={Colors.green} />
        <Cell flex left={Spacing.extraSmall}>
          <Text>{title}</Text>
          <If condition={!simple}>
            <MediumTitle>{upstreamGageLocation?.locationName}</MediumTitle>
          </If>
        </Cell>
      </Row>
    </Card>
  );

  if (isWeb || !pager) {
    return (
      <Link
        href={{
          pathname: ROUTES.GageDetails,
          params: { ...currentParams, id: upstreamGageLocation?.id },
        }}
        replace
        asChild>
        <TouchableOpacity style={touchableStyle}>{innerCard}</TouchableOpacity>
      </Link>
    );
  }

  return (
    <TouchableOpacity
      style={touchableStyle}
      onPress={() => pager.goToIndex(pager.currentIndex - 1)}>
      {innerCard}
    </TouchableOpacity>
  );
});

const DownstreamGageLink = observer(function DownstreamGageLink({ gage, simple }: GageLinkProps) {
  const { getDownstreamGageLocation } = useStores();
  const { t } = useLocale();
  const { isMobile } = useResponsive();
  const pager = useContext(ChainPagerContext);
  const currentParams = useLocalSearchParams();

  const downstreamGageLocation = getDownstreamGageLocation(gage?.locationId);

  if (!downstreamGageLocation) {
    return <Cell />;
  }

  const title = simple ? t("gageScreen.downstreamGage") : t("gageScreen.goToDownstreamGage");
  const iconSize = isMobile && simple ? 16 : 24;
  const Text = isMobile && simple ? LabelText : RegularText;
  const touchableStyle = isMobile ? { flex: 1 } : undefined;

  const innerCard = (
    <Card>
      <Row>
        <Cell flex right={Spacing.extraSmall}>
          <Text>{title}</Text>
          <If condition={!simple}>
            <MediumTitle>{downstreamGageLocation?.locationName}</MediumTitle>
          </If>
        </Cell>
        <Icon name="arrow-right" size={iconSize} color={Colors.green} />
      </Row>
    </Card>
  );

  if (isWeb || !pager) {
    return (
      <Link
        href={{
          pathname: ROUTES.GageDetails,
          params: { ...currentParams, id: downstreamGageLocation?.id },
        }}
        replace
        asChild>
        <TouchableOpacity style={touchableStyle}>{innerCard}</TouchableOpacity>
      </Link>
    );
  }

  return (
    <TouchableOpacity
      style={touchableStyle}
      onPress={() => pager.goToIndex(pager.currentIndex + 1)}>
      {innerCard}
    </TouchableOpacity>
  );
});

const GageDetailsBody = observer(function GageDetailsBody({ gageId }: { gageId: string }) {
  const { gagesStore, regionStore } = useStores();
  const { t } = useLocale();

  const gage = gagesStore.getGageByLocationId(gageId);

  const { isMobile } = useResponsive();

  const goBack = useGoBack(ROUTES.Home);

  if (!gage) {
    return null;
  }

  return (
    <Screen>
      <Head>
        <title>
          {t("common.title")} - {t("homeScreen.title")}
        </title>
      </Head>
      <Stack.Screen
        options={{
          title: `${gage?.locationInfo?.locationName} | ${t("common.title")} - ${t(
            "homeScreen.title"
          )}`,
        }}
      />
      {/* Header */}
      <Row
        horizontal={Spacing.medium}
        bottom={Spacing.extraSmall}
        top={Spacing.medium}
        justify="flex-start">
        <Row flex>
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
          <Cell flex>
            <LargeTitle>{gage?.locationInfo?.locationName ?? ""}</LargeTitle>
          </Cell>
        </Row>
        {/* Top Navigation */}
        <WideScreen>
          <Row flex align="space-between" gap={Spacing.small} right={Spacing.extraLarge}>
            <UpstreamGageLink gage={gage} simple />
            <DownstreamGageLink gage={gage} simple />
          </Row>
        </WideScreen>
        <Cell>
          <Label text={gageId ?? ""} />
        </Cell>
      </Row>
      <MobileScreen>
        <Row
          align="space-between"
          gap={Spacing.small}
          bottom={Spacing.small}
          innerHorizontal={Spacing.medium}>
          <UpstreamGageLink gage={gage} simple />
          <DownstreamGageLink gage={gage} simple />
        </Row>
      </MobileScreen>
      {/* Content */}
      <Content scrollable onRefresh={() => gagesStore.fetchData}>
        <GageDetailsChart gage={gage} />
        <Row>
          <If condition={!isMobile}>
            <Card
              flex={0.5}
              height={"98%"}
              top={Spacing.small}
              right={Spacing.small}
              innerHorizontal={Spacing.tiny}
              innerVertical={Spacing.tiny}>
              <GageMap
                region={regionStore.region}
                gages={gage ? [gage] : []}
                onGagePress={() => {}}
              />
            </Card>
          </If>
          <Cell flex gap={Spacing.small}>
            <RowOrCell
              align="flex-start"
              justify="flex-start"
              top={Spacing.small}
              gap={Spacing.small}>
              <CalloutReadingCard gage={gage} />
              <GageImageCard gage={gage} />
            </RowOrCell>
            <RowOrCell align="flex-start" justify="flex-start" gap={Spacing.small}>
              <GageInfoCard gage={gage} />
              <StatusLevelsCard gage={gage} />
            </RowOrCell>
            <If condition={isMobile}>
              <Card
                flex={1}
                height={300}
                minHeight={300}
                top={Spacing.small}
                innerHorizontal={Spacing.tiny}
                innerVertical={Spacing.tiny}>
                <GageMap
                  region={regionStore.region}
                  gages={gage ? [gage] : []}
                  onGagePress={() => {}}
                />
              </Card>
            </If>
          </Cell>
        </Row>
        <Row flex align="space-between" top={Spacing.medium} gap={Spacing.small}>
          <UpstreamGageLink gage={gage} />
          <DownstreamGageLink gage={gage} />
        </Row>
      </Content>
    </Screen>
  );
});

const GageScreen = observer(function GageScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useLocale();
  const store = useStores();

  const gageId = Array.isArray(id) ? id.join("/") : id;

  const [hidden, setHidden] = useState(isMobile ? true : false);

  useTimeout(() => {
    setHidden(false);
  }, Timing.zero);

  if (hidden) {
    return null;
  }

  const locationIds = store.getLocationWithGagesIds();

  // Locations haven't loaded yet — render nothing rather than flashing the
  // empty-state component for an id we can't yet evaluate.
  if (locationIds.length === 0) {
    return null;
  }

  const pages = locationIds.map((locationId) => ({
    key: locationId,
    route: { pathname: ROUTES.GageDetails, params: { id: locationId } },
    render: () => <GageDetailsBody gageId={locationId} />,
  }));

  const initialIndex = pages.findIndex((p) => p.key === gageId);

  if (initialIndex === -1) {
    return (
      <>
        <Head>
          <title>
            {t("common.title")} - {t("homeScreen.title")}
          </title>
        </Head>
        <EmptyComponent />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false, animation: "none" }} />
      <ChainPager pages={pages} initialIndex={initialIndex} />
    </>
  );
});

export default GageScreen;
