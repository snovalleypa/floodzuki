import React from "react"
import { FlatList, ViewStyle } from "react-native"
import { ErrorBoundaryProps, Stack } from "expo-router"
import { observer } from "mobx-react-lite"
import { t } from "@i18n/translate"

import { Content, Screen } from "@common-ui/components/Screen"
import { ErrorDetails } from "@components/ErrorDetails"
import { AbsoluteContainer, Cell, Row } from "@common-ui/components/Common"
import { Colors } from "@common-ui/constants/colors"
import { useStores } from "@models/helpers/useStores"
import { Spacing } from "@common-ui/constants/spacing"
import { LabelText, LargeTitle, SmallerText, SmallTitle } from "@common-ui/components/Text"
import { Card } from "@common-ui/components/Card"
import { Label } from "@common-ui/components/Label"
import { If } from "@common-ui/components/Conditional"
import { useResponsive } from "@common-ui/utils/responsive"
import { LocationInfo } from "@models/LocationInfo"
import { GageStore } from "@models/Gage"

import { formatFlow, formatHeight } from "@utils/utils"
import { formatReadingTime } from "@utils/useTimeFormat"
import { GageChart } from "@components/GageChart"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

interface GageItemProps {
  item: LocationInfo;
  gagesStore: GageStore;
}

const GageItem = ({ item, gagesStore }: GageItemProps) => {
  const gage = gagesStore.getGageByLocationId(item.id)

  const status = gage?.gageStatus
  const lastReading = status?.lastReading

  const { isMobile } = useResponsive()

  const Title = isMobile ? SmallTitle : LargeTitle

  return (
    <Card height={200} bottom={Spacing.medium}>
      <AbsoluteContainer sticks={["bottom", "left", "right", "top"]}>
        <GageChart gage={gage} optionType="dashboardOptions" />
      </AbsoluteContainer>
      <Cell flex justify="center" innerHorizontal={Spacing.tiny}>
        <Row align="space-between" justify="flex-start">
          <Cell flex>
            <Title color={Colors.lightDark}>{item.locationName}</Title>
          </Cell>
          <Cell>
            <Label text={item.id} />
          </Cell>
        </Row>
        <Row wrap top={Spacing.button}>
          <Label text={status?.floodLevel} />
          <Cell left={Spacing.tiny}>
            <LabelText text={status?.levelTrend} />
          </Cell>
          <Cell left={Spacing.tiny}>
            <SmallTitle color={Colors.lightDark}>
              {formatHeight(lastReading?.waterHeight)}
              <If condition={lastReading?.waterDischarge > 0}>
                {" / "}{formatFlow(lastReading?.waterDischarge)}
              </If>
              <SmallerText>
                {" @ "}{formatReadingTime(item?.timeZoneName, lastReading?.timestamp)}
              </SmallerText>
            </SmallTitle>
          </Cell>
        </Row>
      </Cell>
    </Card>
  )
}

const HomeScreen = observer(
  function HomeScreen() {
    const { gagesStore, getLocationsWithGages } = useStores()

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
            initialNumToRender={3}
            renderItem={({ item }) => <GageItem item={item} gagesStore={gagesStore} />}
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
