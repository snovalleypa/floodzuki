import React from "react";
import { TouchableOpacity } from "react-native";
import { Link } from "expo-router";

import { Card } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { SmallerText, SmallTitle, LargerTitle } from "@common-ui/components/Text";
import { Label, LargeLabel } from "@common-ui/components/Label";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { useResponsive } from "@common-ui/utils/responsive";
import { ROUTES } from "app/_layout";

const ITEM_HEIGHT = 120;

/**
 * Plain-JS shape passed as `item`. We deliberately do NOT take an MST `Gage` instance
 * here: MST 7 has an unfixed bug (github.com/mobxjs/mobx-state-tree#2279) where React
 * DevTools' deep prop traversal in the commit phase trips MST's "initializing phase"
 * assertion when it walks empty `types.array(...)` children. Passing a plain object
 * means DevTools only ever sees plain JS — no MST proxy, no lazy materialization.
 * The caller in HomeScreen extracts the few fields we need from the MST stub.
 */
interface HiddenStubItem {
  locationId: string;
  locationName?: string;
}

interface HiddenGageItemProps {
  item: HiddenStubItem;
}

const HiddenGageItem = function HiddenGageItem({ item }: HiddenGageItemProps) {
  const { t } = useLocale();
  const { isMobile } = useResponsive();

  const Title = isMobile ? SmallTitle : LargerTitle;
  const horizontalPadding = isMobile ? Spacing.medium : Spacing.large;

  return (
    <Card height={ITEM_HEIGHT} bottom={Spacing.medium} innerHorizontal={0} innerVertical={0}>
      <Link href={{ pathname: ROUTES.GageDetails, params: { id: item.locationId } }} asChild>
        <TouchableOpacity style={{ flex: 1 }}>
          <Cell
            flex
            justify="center"
            horizontal={0}
            innerHorizontal={horizontalPadding + Spacing.small}>
            <Row align="space-between" justify="flex-start">
              <Cell flex>
                <Title color={Colors.lightDark}>{item.locationName}</Title>
              </Cell>
              <Cell>
                <Label text={item.locationId} />
              </Cell>
            </Row>
            <Row wrap align="space-between" top={Spacing.small}>
              <LargeLabel type="offline" text={t("statuses.Offline")} />
              <SmallerText muted>{t("regionSummary.noRecentData")}</SmallerText>
            </Row>
          </Cell>
        </TouchableOpacity>
      </Link>
    </Card>
  );
};

export default HiddenGageItem;
