import React, { useEffect } from "react"
import { ViewStyle, FlatList, TouchableOpacity, useWindowDimensions } from "react-native"
import { ErrorBoundaryProps, Stack, useRouter } from "expo-router"
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
import { isWeb, useResponsive } from "@common-ui/utils/responsive"
import { Gage, STATUSES } from "@models/Gage"

import { useUtils } from "@utils/utils"
import { formatReadingTime } from "@utils/useTimeFormat"
import { ROUTES } from "app/_layout"
import TrendIcon, { levelTrendIconName } from "@components/TrendIcon"
import { useInterval } from "@utils/useTimeout"
import EmptyComponent from "@common-ui/components/EmptyComponent"
import { GageChart } from "@components/GageChart"
import GageMap from "@components/GageMap";
import GageListItemChart from "@components/GageListItemChart";
import WebFooter from "@components/WebFooter"
import { useLocale } from "@common-ui/contexts/LocaleContext"

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

    const goToDetails = () => {
      router.push({ pathname: ROUTES.GageDetails, params: { id: gage?.locationId }})
    }

    const Title = isMobile ? SmallTitle : LargerTitle
    const DescriptiveText = isMobile ? LabelText : SmallTitle
    const SmallText = isMobile ? TinyText : SmallerText
    const horizontalPadding = isMobile ? Spacing.medium : Spacing.large

    return (
      <Card height={ITEM_HEIGHT} bottom={Spacing.medium} innerHorizontal={0} innerVertical={0}>
        <TouchableOpacity style={{ flex: 1 }} onPress={goToDetails}>
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
    const { gagesStore, getLocationsWithGages } = useStores()
    const { t } = useLocale();
    const { isMobile } = useResponsive()

    const { height } = useWindowDimensions()

    useEffect(() => {
      gagesStore.fetchData()
    }, [])

    // Update gage status every 5 minutes
    useInterval(() => {
      gagesStore.fetchData()
    }, 5 * 60 * 1000)

    const locations = getLocationsWithGages()

    const mapCardHeight = height - HEADER_HEIGHT - Spacing.button

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
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
