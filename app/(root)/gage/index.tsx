import React, { useEffect } from "react";
import { ViewStyle, FlatList, TouchableOpacity, useWindowDimensions } from "react-native";
import { ErrorBoundaryProps, Link, useRouter } from "expo-router";
import PageTitle from "@common-ui/components/PageTitle";

import { observer } from "mobx-react-lite";

import { Screen } from "@common-ui/components/Screen";
import { ErrorDetails } from "@components/ErrorDetails";
import { AbsoluteContainer, Cell, Row } from "@common-ui/components/Common";
import { Colors } from "@common-ui/constants/colors";
import { useStores } from "@models/helpers/useStores";
import { Spacing } from "@common-ui/constants/spacing";
import {
  LabelText,
  LargerTitle,
  SmallerText,
  SmallTitle,
  TinyText,
} from "@common-ui/components/Text";
import { Card } from "@common-ui/components/Card";
import { Label, LargeLabel } from "@common-ui/components/Label";
import { If, Ternary } from "@common-ui/components/Conditional";
import { isAndroid, isWeb, useResponsive } from "@common-ui/utils/responsive";
import { Gage, STATUSES } from "@models/Gage";

import { useUtils } from "@utils/utils";
import { formatReadingTime } from "@utils/useTimeFormat";
import { ROUTES } from "app/_layout";
import TrendIcon, { TREND_ICON_TYPES } from "@components/TrendIcon";
import { useInterval } from "@utils/useTimeout";
import EmptyComponent from "@common-ui/components/EmptyComponent";
import { GageChart } from "@components/GageChart";
import GageMap from "@components/GageMap";
import GageListItemChart from "@components/GageListItemChart";
import RegionSummaryCard from "@components/RegionSummaryCard";
import HiddenGageItem from "@components/HiddenGageItem";
import WebFooter from "@components/WebFooter";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { TxKeyPath } from "@i18n/i18n";
import { Timing } from "@common-ui/constants/timing";
import { RefreshControl, ScrollView } from "react-native-gesture-handler";

const ITEM_HEIGHT = 200;
const MAP_WIDTH = 400;
const HEADER_HEIGHT = 56;

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

interface GageItemProps {
  item: Gage;
}

const GageStatus = observer(({ gage }: { gage: Gage }) => {
  const { t } = useLocale();

  return (
    <LargeLabel
      type={STATUSES[gage?.gageStatus?.floodLevel]}
      text={t(`statuses.${gage?.gageStatus?.floodLevel}` as TxKeyPath)}
    />
  );
});

const GageItem = observer(function GageItem({ item }: GageItemProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { formatFlow, formatHeight } = useUtils();
  const { getTimezone } = useStores();
  const tz = getTimezone();

  const gage = item;

  const status = gage?.gageStatus;
  const lastReading = status?.lastReading;

  const Title = isMobile ? SmallTitle : LargerTitle;
  const DescriptiveText = isMobile ? LabelText : SmallTitle;
  const SmallText = isMobile ? TinyText : SmallerText;
  const horizontalPadding = isMobile ? Spacing.medium : Spacing.large;

  return (
    <Card height={ITEM_HEIGHT} bottom={Spacing.medium} innerHorizontal={0} innerVertical={0}>
      <Link href={{ pathname: ROUTES.GageDetails, params: { id: gage?.locationId } }} asChild>
        <TouchableOpacity style={{ flex: 1 }}>
          <AbsoluteContainer sticks={["bottom", "left", "right", "top"]}>
            <Ternary condition={isWeb}>
              <GageChart gage={gage} optionType="dashboardOptions" />
              <GageListItemChart gage={gage} />
            </Ternary>
          </AbsoluteContainer>
          <Cell
            flex
            justify="center"
            horizontal={0}
            innerHorizontal={horizontalPadding + Spacing.small}
            bgColor={"rgba(255,255,255,0.5)"}>
            <Row align="space-between" justify="flex-start">
              <Cell flex>
                <Title color={Colors.lightDark}>{gage?.locationInfo?.locationName}</Title>
              </Cell>
              <Cell>
                <Label text={gage?.locationId} />
              </Cell>
            </Row>
            <Row wrap align="space-between" top={Spacing.medium}>
              <Row>
                <GageStatus gage={gage} />
                <Cell left={Spacing.medium}>
                  <TrendIcon gage={gage} iconType={TREND_ICON_TYPES.Trend} />
                </Cell>
              </Row>
              <Row justify="flex-end" left={Spacing.tiny}>
                <If condition={!!lastReading?.waterHeight}>
                  <DescriptiveText color={Colors.lightDark}>
                    {formatHeight(lastReading?.waterHeight)}
                    <If condition={lastReading?.waterDischarge > 0}>
                      {" / "}
                      {formatFlow(lastReading?.waterDischarge)}
                    </If>
                  </DescriptiveText>
                </If>
                <If condition={!!lastReading?.timestamp}>
                  <SmallText>
                    {" @ "}
                    {formatReadingTime(lastReading?.timestamp, tz)}
                  </SmallText>
                </If>
              </Row>
            </Row>
          </Cell>
        </TouchableOpacity>
      </Link>
    </Card>
  );
});

const HeaderComponent = () => {
  return (
    <>
      <RegionSummaryCard />
    </>
  );
};

const keyExtractor = (item: Gage) => item?.locationId;
const renderGageItem = ({ item }: { item: Gage }) => {
  if (item?._isStub) {
    return <HiddenGageItem item={item} />;
  }
  return <GageItem item={item} />;
};
const getItemLayout = (data: Gage[], index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

const HomeScreen = observer(function HomeScreen() {
  const { gagesStore, regionStore, getLocationsWithGages, isFetched } = useStores();
  const { t } = useLocale();
  const { isMobile } = useResponsive();

  const { height } = useWindowDimensions();

  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (isFetched) {
      gagesStore.fetchData();
    }
  }, [isFetched]);

  // Update gage status every 5 minutes
  useInterval(() => {
    gagesStore.fetchData();
  }, Timing.fiveMinutes);

  const handleOnRefresh = React.useCallback(() => {
    setRefreshing(true);

    gagesStore.fetchData();

    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [gagesStore.fetchData]);

  const router = useRouter();
  const locations = getLocationsWithGages();

  const mapCardHeight = height - HEADER_HEIGHT - Spacing.button;

  const baseControls = (
    <Screen>
      <PageTitle name={t("pageTitles.gageList")} />
      <Row justify="flex-start">
        <If condition={!isMobile}>
          <Card
            width={MAP_WIDTH}
            vertical={Spacing.small}
            height={mapCardHeight}
            left={Spacing.small}
            innerHorizontal={Spacing.tiny}
            innerVertical={Spacing.tiny}>
            <GageMap
              gages={locations}
              region={regionStore.region}
              onGagePress={(gage) => {
                if (gage && router) {
                  router.push({ pathname: ROUTES.GageDetails, params: { id: gage.locationId } });
                }
              }}
            />
          </Card>
        </If>
        <Cell flex height={isMobile ? "100%" : mapCardHeight + Spacing.small}>
          <FlatList
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleOnRefresh} />}
            contentContainerStyle={$listStyles}
            data={locations}
            showsVerticalScrollIndicator={false}
            initialNumToRender={4}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            renderItem={renderGageItem}
            ListEmptyComponent={<EmptyComponent />}
            ListHeaderComponent={<HeaderComponent />}
          />
        </Cell>
      </Row>
      <WebFooter />
    </Screen>
  );
  if (isWeb) {
    return <ScrollView>{baseControls}</ScrollView>;
  }
  return baseControls;
});

const $listStyles: ViewStyle = {
  padding: Spacing.small,
  paddingBottom: Spacing.zero,
};

export default HomeScreen;
