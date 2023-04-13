import React, { useEffect } from "react"
import { ViewStyle, TouchableOpacity } from "react-native"
import { ErrorBoundaryProps, Stack, useRouter } from "expo-router"
import { FlashList } from "@shopify/flash-list";
import { observer } from "mobx-react-lite"
import { t } from "@i18n/translate"

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import { AbsoluteContainer, Cell, Row } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"
import { useStores } from "@models/helpers/useStores"
import { Spacing } from "@common-ui/constants/spacing"
import { LabelText, LargerTitle, SmallerText, SmallTitle, TinyText } from "@common-ui/components/Text"
import { Card } from "@common-ui/components/Card"
import { Label, LargeLabel } from "@common-ui/components/Label"
import { If } from "@common-ui/components/Conditional"
import { useResponsive } from "@common-ui/utils/responsive"
import { Gage, STATUSES } from "@models/Gage"

import { formatFlow, formatHeight } from "@utils/utils"
import { formatReadingTime } from "@utils/useTimeFormat"
import { GageChart } from "@components/GageChart"
import { ROUTES } from "app/_layout"
import TrendIcon, { levelTrendIconName } from "@components/TrendIcon"
import { useInterval } from "@utils/useTimeout"
import EmptyComponent from "@common-ui/components/EmptyComponent"

const ITEM_HEIGHT = 200

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

interface GageItemProps {
  item: string;
}

const GageStatus = observer(({ gage }: { gage: Gage }) => {
  return (
    <LargeLabel
      type={STATUSES[gage?.gageStatus?.floodLevel]}
      text={gage?.gageStatus?.floodLevel} />
  )
})

const GageItem = observer(
  function GageItem({ item }: GageItemProps) {
    const router = useRouter();
    const { gagesStore } = useStores()
    const { isMobile } = useResponsive()

    const gage = gagesStore.getGageByLocationId(item)

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
            <GageChart gage={gage} optionType="dashboardOptions" />
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

const keyExtractor = (item: string) => item

const HomeScreen = observer(
  function HomeScreen() {
    const { gagesStore, getLocationWithGagesIds } = useStores()

    useEffect(() => {
      gagesStore.fetchData()
    }, [])

    // Update gage status every 5 minutes
    useInterval(() => {
      gagesStore.fetchData()
    }, 5 * 60 * 1000)

    const locations = getLocationWithGagesIds()

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <Content noPadding>
          <FlashList
            contentContainerStyle={$listStyles}
            data={locations}
            showsVerticalScrollIndicator={false}
            keyExtractor={keyExtractor}
            estimatedItemSize={ITEM_HEIGHT}
            renderItem={({ item }) => <GageItem item={item} />}
            ListEmptyComponent={<EmptyComponent />}
          />
        </Content>
      </Screen>
    )
  }
)

const $listStyles: ViewStyle = {
  padding: Spacing.small,
  paddingBottom: Spacing.zero,
}

export default HomeScreen
