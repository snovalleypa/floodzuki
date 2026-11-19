import { render } from "@testing-library/react-native";
import { BannerTypes, RegionBanners } from "../../models/Banners";
import GaugeBannerControl from "../GaugeBannerControl";

const mockGaugeId = "YOUR-HOUSE";

const mockGauge: any = {
  locationId: mockGaugeId,
};

const buildMockRegionBanners = (
  gageId: string,
  bannerType: string | undefined,
  banner: string | undefined
) => {
  const ret = {
    regionBanner: undefined,
    regionBannerType: undefined,
    gaugeBanners: new Map(),
  };
  ret.gaugeBanners.set(gageId, {
    bannerType,
    banner,
  });
  return ret as unknown as RegionBanners;
};

describe("Region Banner Control", () => {
  it("doesn't show anything if there's no banner text", () => {
    const { toJSON } = render(
      <GaugeBannerControl
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, undefined)}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("doesn't show anything if there's no banner type", () => {
    const { toJSON } = render(
      <GaugeBannerControl
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, undefined, "hi there")}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("shows an info icon", () => {
    const { getByTestId } = render(
      <GaugeBannerControl
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.info, "hi there")}
      />
    );
    const img = getByTestId("gauge-banner-icon");
    expect(img.props.source[0].testUri.toString()).toStrictEqual(
      expect.stringContaining("alert-info")
    );
  });

  it("shows a warning icon", () => {
    const { getByTestId } = render(
      <GaugeBannerControl
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.warning, "hi there")}
      />
    );
    const img = getByTestId("gauge-banner-icon");
    expect(img.props.source[0].testUri.toString()).toStrictEqual(
      expect.stringContaining("alert-medium")
    );
  });

  it("shows a danger icon", () => {
    const { getByTestId } = render(
      <GaugeBannerControl
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, "hi there")}
      />
    );
    const img = getByTestId("gauge-banner-icon");
    expect(img.props.source[0].testUri.toString()).toStrictEqual(
      expect.stringContaining("alert-high")
    );
  });

  it("shows the banner text", () => {
    const { queryByText } = render(
      <GaugeBannerControl
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, "this is my banner")}
      />
    );
    expect(queryByText("this is my banner")).not.toBeNull();
  });
});
