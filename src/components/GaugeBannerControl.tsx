import React from "react";
import { Gage } from "../models/Gage";
import { BannerTypes, RegionBanners } from "../models/Banners";
import { Spacing } from "../common-ui/constants/spacing";
import { MediumText } from "../common-ui/components/Text";
import { Card } from "../common-ui/components/Card";
import { ColorTypes } from "../common-ui/constants/colors";
import { Cell, Row } from "../common-ui/components/Common";
import GaugeBannerIcon from "./GaugeBannerIcon";

const GaugeBannerControl = ({
  gauge,
  regionBanners,
}: {
  gauge: Gage;
  regionBanners?: RegionBanners;
}) => {
  const gaugeBanners = regionBanners?.gaugeBanners.get(gauge.locationId);
  if (!gaugeBanners) {
    return null;
  }
  const { bannerType, banner } = gaugeBanners;
  if (!bannerType || !banner) {
    return null;
  }

  let cardType: ColorTypes | "default" = "default";
  switch (bannerType.toLowerCase()) {
    default:
    case BannerTypes.info:
      break;
    case BannerTypes.warning:
      cardType = ColorTypes.warning;
      break;
    case BannerTypes.danger:
      cardType = ColorTypes.danger;
      break;
  }

  return (
    <Card
      testID="region-banner-card"
      outline={false}
      type={cardType}
      bottom={Spacing.extraSmall}
      innerHorizontal={Spacing.medium}
      innerVertical={Spacing.extraSmall}>
      <Row justify="flex-start" align="flex-start">
        <GaugeBannerIcon
          gauge={gauge}
          regionBanners={regionBanners}
          showPopup={false}
          leftSpacing={false}
          rightSpacing={false}
        />
        <Cell left={Spacing.medium}>
          <MediumText>{banner}</MediumText>
        </Cell>
      </Row>
    </Card>
  );
};

export default GaugeBannerControl;
