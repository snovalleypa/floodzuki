import React from "react";
import { TouchableOpacity } from "react-native";
import { t } from "@i18n/translate";
import { ErrorBoundaryProps, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";

import { IconButton, LinkButton } from "@common-ui/components/Button";
import { Cell, Row, RowOrCell } from "@common-ui/components/Common";
import { If, Ternary } from "@common-ui/components/Conditional";
import { Label } from "@common-ui/components/Label";
import { Content, Screen } from "@common-ui/components/Screen";
import { LargeTitle, MediumTitle, RegularText } from "@common-ui/components/Text";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useResponsive } from "@common-ui/utils/responsive";

import { useStores } from "@models/helpers/useStores";
import { Gage } from "@models/Gage";

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

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const UpstreamGageLink = observer(
  function UpstreamGageLink({ gage }: { gage: Gage }) {
    const { getUpstreamGageLocation } = useStores();
    const { isMobile } = useResponsive();
    const router = useRouter();

    const upstreamGageLocation = getUpstreamGageLocation(gage.locationId)

    if (!upstreamGageLocation) {
      return <Cell />
    }

    const navigateToGage = () => {
      router.push({ pathname: ROUTES.GageDetails, params: { id: upstreamGageLocation?.id }})
    }

    return (
      <Card flex={isMobile ? 1 : 0} >
        <TouchableOpacity onPress={navigateToGage}>
          <Row>
            <Icon name="arrow-left" color={Colors.green} />
            <Cell flex left={Spacing.extraSmall}>
              <RegularText>Go to Upstream Gage</RegularText>
              <MediumTitle>{upstreamGageLocation?.locationName}</MediumTitle>
            </Cell>
          </Row>
        </TouchableOpacity>
      </Card>
    )
  }
)

const DownstreamGageLink = observer(
  function DownstreamGageLink({ gage }: { gage: Gage }) {
    const { getDownstreamGageLocation } = useStores();
    const { isMobile } = useResponsive();
    const router = useRouter();

    const downstreamGageLocation = getDownstreamGageLocation(gage.locationId)

    if (!downstreamGageLocation) {
      return <Cell />
    }

    const navigateToGage = () => {
      router.push({ pathname: ROUTES.GageDetails, params: { id: downstreamGageLocation?.id }})
    }

    return (
      <Card flex={isMobile ? 1 : 0} >
        <TouchableOpacity onPress={navigateToGage}>
          <Row>
            <Cell flex right={Spacing.extraSmall}>
              <RegularText>Go to Downstream Gage</RegularText>
              <MediumTitle>{downstreamGageLocation?.locationName}</MediumTitle>
            </Cell>
            <Icon name="arrow-right" color={Colors.green} />
          </Row>
        </TouchableOpacity>
      </Card>
    )
  }
)

const GageDetailsScreen = observer(
  function GageDetailsScreen({ gage }: { gage: Gage }) {
    const router = useRouter();
    
    const { id } = useLocalSearchParams();
    
    const gageId = Array.isArray(id) ? id.join("/") : id

    const { isMobile } = useResponsive();
    
    const goBack = () => {
      router.push({ pathname: ROUTES.Home })
    }

    return (
      <Screen>
        <Stack.Screen options={{
          title: `${gage?.locationInfo?.locationName} | ${t("common.title")} - ${t("homeScreen.title")}`
        }} />
        {/* Header */}
        <Row horizontal={Spacing.medium} top={Spacing.medium} justify="flex-start">
          <Row flex>
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
            <Cell flex>
              <LargeTitle>
                {gage?.locationInfo?.locationName}
              </LargeTitle>
            </Cell>
          </Row>
          <Cell>
            <Label text={gageId} />
          </Cell>
        </Row>
        {/* Content */}
        <Content scrollable>
          <GageDetailsChart gage={gage} />
          <Row>
            <If condition={!isMobile}>
              <Card
                flex={0.5}
                height={"98%"}
                top={Spacing.small}
                right={Spacing.small}
                innerHorizontal={Spacing.tiny}
                innerVertical={Spacing.tiny}
              >
                <GageMap gages={[gage]} />
              </Card>
            </If>
            <Cell flex gap={Spacing.small}>
              <RowOrCell align="flex-start" top={Spacing.small} gap={Spacing.small}>
                <CalloutReadingCard gage={gage} />
                <GageImageCard gage={gage} />
              </RowOrCell>
              <RowOrCell align="flex-start" gap={Spacing.small}>
                <GageInfoCard gage={gage} />
                <StatusLevelsCard gage={gage} />
              </RowOrCell>
              <If condition={isMobile}>
                <Card
                  flex={"none"}
                  height={300}
                  minHeight={300}
                  top={Spacing.small}
                  innerHorizontal={Spacing.tiny}
                  innerVertical={Spacing.tiny}
                >
                  <GageMap gages={[gage]} />
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
    )
  }
)

const GageScreen = observer(
  function GageScreen() {
    const { id } = useLocalSearchParams();

    const { gagesStore } = useStores();
    
    const gageId = Array.isArray(id) ? id.join("/") : id
    const gage = gagesStore.gages.find(gage => gage.locationId === gageId)

    if (!gage?.locationId) {
      return <EmptyComponent />
    }

    return <GageDetailsScreen gage={gage} />
  }
)

export default GageScreen;
