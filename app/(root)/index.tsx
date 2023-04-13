import React, { useEffect } from "react"
import { FlatList, ViewStyle, TouchableOpacity } from "react-native"
import { ErrorBoundaryProps, Stack, useRouter } from "expo-router"
import { observer } from "mobx-react-lite"
import { t } from "@i18n/translate"

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import { AbsoluteContainer, Cell, Row } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"
import { useStores } from "@models/helpers/useStores"
import { Spacing } from "@common-ui/constants/spacing"
import { LabelText, LargerTitle, RegularText, SmallerText, SmallTitle, TinyText } from "@common-ui/components/Text"
import { Card } from "@common-ui/components/Card"
import { Label, LargeLabel } from "@common-ui/components/Label"
import { If } from "@common-ui/components/Conditional"
import { useResponsive } from "@common-ui/utils/responsive"
import { LocationInfo } from "@models/LocationInfo"
import { Gage, GageStore, STATUSES } from "@models/Gage"

import { formatFlow, formatHeight } from "@utils/utils"
import { formatReadingTime } from "@utils/useTimeFormat"
import { GageChart } from "@components/GageChart"
import Icon from "@common-ui/components/Icon"
import { ROUTES } from "app/_layout"
import TrendIcon, { levelTrendIconName } from "@components/TrendIcon"
import { useInterval } from "@utils/useTimeout"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

interface GageItemProps {
  item: LocationInfo;
  gagesStore: GageStore;
}

const GageStatus = observer(({ gage }: { gage: Gage }) => {
  return (
    <LargeLabel
      type={STATUSES[gage?.gageStatus?.floodLevel]}
      text={gage?.gageStatus?.floodLevel} />
  )
})

const GageItem = React.memo(
  function GageItem({ item, gagesStore }: GageItemProps) {
    const router = useRouter();
    const { isMobile } = useResponsive()

    const gage = gagesStore.getGageByLocationId(item.id)

    const status = gage?.gageStatus
    const lastReading = status?.lastReading

    const goToDetails = () => {
      router.push({ pathname: ROUTES.GageDetails, params: { id: item.id }})
    }

    const Title = isMobile ? SmallTitle : LargerTitle
    const DescriptiveText = isMobile ? LabelText : SmallTitle
    const SmallText = isMobile ? TinyText : SmallerText
    const horizontalPadding = isMobile ? Spacing.medium : Spacing.large

    return (
      <TouchableOpacity onPress={goToDetails}>
        <Card height={200} bottom={Spacing.medium}>
          <AbsoluteContainer sticks={["bottom", "left", "right", "top"]}>
            <GageChart gage={gage} optionType="dashboardOptions" />
          </AbsoluteContainer>
          <Cell
            flex
            justify="center"
            horizontal={-Spacing.small}
            innerHorizontal={horizontalPadding + Spacing.small}
            bgColor={"rgba(255,255,255,0.5)"}
          >
            <Row align="space-between" justify="flex-start">
              <Cell flex>
                <Title color={Colors.lightDark}>{item.locationName}</Title>
              </Cell>
              <Cell>
                <Label text={item.id} />
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
        </Card>
      </TouchableOpacity>
    )
  }
)

const GageItemObserved = observer((props: GageItemProps) => <GageItem {...props} />)

const EmptyComponent = () => (
  <Cell flex align="center" justify="center">
    <RegularText>Loading ...</RegularText>
  </Cell>
)

const HomeScreen = observer(
  function HomeScreen() {
    const { gagesStore, getLocationsWithGages } = useStores()

    useEffect(() => {
      gagesStore.fetchData()
    }, [])

    // Update gage status every 5 minutes
    useInterval(() => {
      gagesStore.fetchData()
    }, 5 * 60 * 1000)

    const locations = getLocationsWithGages()

    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <Content noPadding>
          <FlatList
            style={$listStyles}
            data={locations}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            initialNumToRender={4}
            renderItem={({ item }) => <GageItemObserved item={item} gagesStore={gagesStore} />}
            ListEmptyComponent={<EmptyComponent />}
          />
        </Content>
      </Screen>
    )
  }
)

const $listStyles: ViewStyle = {
  padding: Spacing.medium,
  paddingBottom: Spacing.zero,
}

export default HomeScreen
