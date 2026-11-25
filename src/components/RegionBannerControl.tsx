import { observer } from "mobx-react-lite";
import { Row } from "../common-ui/components/Common";
import { Spacing } from "../common-ui/constants/spacing";
import { useStores } from "../models/helpers/useStores";
import { MediumText } from "../common-ui/components/Text";
import { Card } from "../common-ui/components/Card";
import { ColorTypes } from "../common-ui/constants/colors";
import { BannerTypes } from "../models/Banners";

const RegionBannerControl = observer(function RegionBannerControl() {
  const { regionBannersStore } = useStores();
  const { regionBanner, regionBannerType } = regionBannersStore.regionBanners || {
    regionBanner: null,
    regionBannerType: null,
  };
  if (!regionBanner || !regionBannerType) {
    return null;
  }

  let cardType: ColorTypes | "default" = "default";
  switch (regionBannerType.toLowerCase()) {
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
      <Row justify="center" align="space-between">
        <MediumText>{regionBanner}</MediumText>
      </Row>
    </Card>
  );
});

export default RegionBannerControl;
