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
import { Gage } from "@models/Gage";
import { ROUTES } from "app/_layout";

const ITEM_HEIGHT = 120;

interface HiddenGageItemProps {
  item: Gage;
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
                <Title color={Colors.lightDark}>{item.locationInfo?.locationName}</Title>
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
