import { fireEvent, render } from "@testing-library/react-native";
import { BannerTypes, RegionBanners } from "../../models/Banners";
import GaugeBannerIcon from "../GaugeBannerIcon";

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
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={true}
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, undefined)}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("doesn't show anything if there's no banner type", () => {
    const { toJSON } = render(
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={true}
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, undefined, "hi there")}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("shows an info icon", () => {
    const { getByTestId } = render(
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={true}
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
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={true}
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
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={true}
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, "hi there")}
      />
    );
    const img = getByTestId("gauge-banner-icon");
    expect(img.props.source[0].testUri.toString()).toStrictEqual(
      expect.stringContaining("alert-high")
    );
  });

  it("shows and hides the popup", () => {
    const { queryByTestId, queryByText } = render(
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={true}
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, "this is my banner")}
      />
    );
    expect(queryByTestId("gauge-banner-popup")).toBeNull();
    expect(queryByText("this is my banner")).toBeNull();

    const icon = queryByTestId("gauge-banner-icon");
    fireEvent.press(icon);
    expect(queryByTestId("gauge-banner-popup")).not.toBeNull();
    expect(queryByText("this is my banner")).not.toBeNull();

    fireEvent.press(icon);
    expect(queryByTestId("gauge-banner-popup")).toBeNull();
    expect(queryByText("this is my banner")).toBeNull();
  });

  it("doesn't show a popup in no-popup mode", () => {
    const { queryByTestId, queryByText } = render(
      <GaugeBannerIcon
        leftSpacing={true}
        rightSpacing={true}
        showPopup={false}
        gauge={mockGauge}
        regionBanners={buildMockRegionBanners(mockGaugeId, BannerTypes.danger, "this is my banner")}
      />
    );
    expect(queryByTestId("gauge-banner-popup")).toBeNull();
    expect(queryByText("this is my banner")).toBeNull();

    const icon = queryByTestId("gauge-banner-icon");
    fireEvent.press(icon);
    expect(queryByTestId("gauge-banner-popup")).toBeNull();
    expect(queryByText("this is my banner")).toBeNull();
  });
});
