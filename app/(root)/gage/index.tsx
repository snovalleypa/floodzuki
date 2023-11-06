import React, { useEffect } from "react"
import { ViewStyle, FlatList, TouchableOpacity, useWindowDimensions } from "react-native"
import { ErrorBoundaryProps, Link, useRouter } from "expo-router"
import Head from "expo-router/head"

import { observer } from "mobx-react-lite"

import { Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import { AbsoluteContainer, Cell, Row } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"
import { useStores } from "@models/helpers/useStores"
import { Spacing } from "@common-ui/constants/spacing"
import { LabelText, LargerTitle, SmallerText, SmallTitle, TinyText } from "@common-ui/components/Text"
import { Card } from "@common-ui/components/Card"
import { Label, LargeLabel } from "@common-ui/components/Label"
import { If, Ternary } from "@common-ui/components/Conditional"
import { isAndroid, isWeb, useResponsive } from "@common-ui/utils/responsive"
import { Gage, STATUSES } from "@models/Gage"

import { useUtils } from "@utils/utils"
import { formatReadingTime } from "@utils/useTimeFormat"
import { ROUTES } from "app/_layout"
import TrendIcon, { levelTrendIconName } from "@components/TrendIcon"
import { useInterval, useTimeout } from "@utils/useTimeout"
import EmptyComponent from "@common-ui/components/EmptyComponent"
import { GageChart } from "@components/GageChart"
import GageMap from "@components/GageMap";
import GageListItemChart from "@components/GageListItemChart";
import WebFooter from "@components/WebFooter"
import { useLocale } from "@common-ui/contexts/LocaleContext"
import { Timing } from "@common-ui/constants/timing"
import { RefreshControl } from "react-native-gesture-handler"

const ITEM_HEIGHT = 200
const MAP_WIDTH = 400
const HEADER_HEIGHT = 56

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
      text={t(`statuses.${gage?.gageStatus?.floodLevel}`)} />
  )
})

const GageItem = observer(
  function GageItem({ item }: GageItemProps) {
    const router = useRouter();
    const { isMobile } = useResponsive()
    const { formatFlow, formatHeight } = useUtils()

    const gage = item

    const status = gage?.gageStatus
    const lastReading = status?.lastReading

    const Title = isMobile ? SmallTitle : LargerTitle
    const DescriptiveText = isMobile ? LabelText : SmallTitle
    const SmallText = isMobile ? TinyText : SmallerText
    const horizontalPadding = isMobile ? Spacing.medium : Spacing.large

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
              bgColor={"rgba(255,255,255,0.5)"}
            >
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
                    <TrendIcon iconName={levelTrendIconName(gage?.status?.levelTrend)} />
                  </Cell>
                </Row>
                <Row justify="flex-end" left={Spacing.tiny}>
                  <If condition={!!lastReading?.waterHeight}>
                    <DescriptiveText color={Colors.lightDark}>
                      {formatHeight(lastReading?.waterHeight)}
                      <If condition={lastReading?.waterDischarge > 0}>
                        {" / "}{formatFlow(lastReading?.waterDischarge)}
                      </If>
                    </DescriptiveText>
                  </If>
                  <If condition={!!lastReading?.timestamp}>
                    <SmallText>
                      {" @ "}{formatReadingTime(lastReading?.timestamp)}
                    </SmallText>
                  </If>
                </Row>
              </Row>
            </Cell>
          </TouchableOpacity>
        </Link>
      </Card>
    )
  }
)

const HeaderComponent = ({ gages }: { gages: Gage[] }) => {
  const { isMobile } = useResponsive()

  return (
    <If condition={isMobile}>
      <Card
        height={300}
        innerHorizontal={Spacing.tiny}
        innerVertical={Spacing.tiny}
        bottom={Spacing.small}>
        <GageMap gages={gages} />
      </Card>
    </If>
  )
}

const keyExtractor = (item: Gage) => item?.locationId
const getItemLayout = (data: Gage[], index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
})

const HomeScreen = observer(
  function HomeScreen() {
    const { gagesStore, getLocationsWithGages, isFetched } = useStores()
    const { t } = useLocale();
    const { isMobile } = useResponsive()

    const { height } = useWindowDimensions()

    const [hidden, setHidden] = React.useState(isMobile ? true : false)
    const [refreshing, setRefreshing] = React.useState(false);

    // Fetch data on mount
    useEffect(() => {
      if (isFetched)  {
        gagesStore.fetchData()
      }
    }, [isFetched])

    // Update gage status every 5 minutes
    useInterval(() => {
      gagesStore.fetchData()
    }, Timing.fiveMinutes)

    useTimeout(() => {
      setHidden(false)
    }, Timing.zero)

    const handleOnRefresh = React.useCallback(() => {
      setRefreshing(true);
      
      gagesStore.fetchData()
      
      setTimeout(() => {
        setRefreshing(false);
      }, 2000);
    }, [gagesStore.fetchData]);
    
    const locations = hidden ? [] : getLocationsWithGages()
    
    const mapCardHeight = height - HEADER_HEIGHT - Spacing.button

    return (
      <Screen>
        <Head>
          <title>{t("common.title")} - {t("homeScreen.title")}</title>
        </Head>
        <Row justify="flex-start">
          <If condition={!isMobile}>
            <Card
              width={MAP_WIDTH}
              vertical={Spacing.small}
              height={mapCardHeight}
              left={Spacing.small}
              innerHorizontal={Spacing.tiny}
              innerVertical={Spacing.tiny}
            >
              <GageMap gages={locations} />
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
              renderItem={({ item }) => <GageItem item={item} />}
              ListEmptyComponent={<EmptyComponent />}
              ListHeaderComponent={<HeaderComponent gages={locations} />}
            />
          </Cell>
        </Row>
        <WebFooter />
      </Screen>
    )
  }
)

const $listStyles: ViewStyle = {
  padding: Spacing.small,
  paddingBottom: Spacing.zero,
}

export default HomeScreen
