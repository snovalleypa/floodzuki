import React from "react";
import { TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";

import { Card } from "@common-ui/components/Card";
import { Cell, Row } from "@common-ui/components/Common";
import { SmallerText, SmallTitle } from "@common-ui/components/Text";
import { Label, LargeLabel } from "@common-ui/components/Label";
import { Colors } from "@common-ui/constants/colors";
import { Spacing } from "@common-ui/constants/spacing";
import { useLocale } from "@common-ui/contexts/LocaleContext";
import { Gage } from "@models/Gage";
import { ROUTES } from "app/_layout";

const ITEM_HEIGHT = 200;

interface HiddenGageItemProps {
  item: Gage;
}

const HiddenGageItem = observer(function HiddenGageItem({ item }: HiddenGageItemProps) {
  const { t } = useLocale();

  return (
    <Card
      height={ITEM_HEIGHT}
      bottom={Spacing.medium}
      innerHorizontal={0}
      innerVertical={0}
      backgroundColor={Colors.lightGrey}>
      <Link href={{ pathname: ROUTES.GageDetails, params: { id: item?.locationId } }} asChild>
        <TouchableOpacity style={{ flex: 1 }}>
          <Cell
            flex
            justify="center"
            innerHorizontal={Spacing.large}
            innerVertical={Spacing.medium}>
            <Row align="space-between" justify="flex-start">
              <Cell flex>
                <SmallTitle color={Colors.midGrey}>{item?.locationInfo?.locationName}</SmallTitle>
              </Cell>
              <Cell>
                <Label text={item?.locationId} />
              </Cell>
            </Row>
            <Row wrap align="space-between" top={Spacing.medium}>
              <LargeLabel type="offline" text={t("regionSummary.offlineGauge")} />
              <SmallerText color={Colors.midGrey}>{t("regionSummary.noRecentData")}</SmallerText>
            </Row>
          </Cell>
        </TouchableOpacity>
      </Link>
    </Card>
  );
});

export default HiddenGageItem;
