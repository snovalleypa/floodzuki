import { render } from "@testing-library/react-native";
import { BannerTypes } from "../../models/Banners";
import RegionBannerControl from "../RegionBannerControl";
import { Palette } from "../../common-ui/constants/colors";

// Minimal stub store; only the fields RegionBannerControl reads.
const buildMockBannerStore = (bannerType: BannerTypes | null, bannerText: string | null) => ({
  regionBannersStore: { regionBanners: { regionBannerType: bannerType, regionBanner: bannerText } },
});
let mockBannerStore: ReturnType<typeof buildMockBannerStore>;

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => mockBannerStore,
}));

describe("Region Banner Control", () => {
  it("doesn't show anything if there's no banner text", () => {
    mockBannerStore = buildMockBannerStore(BannerTypes.info, null);
    const { toJSON } = render(<RegionBannerControl />);
    expect(toJSON()).toBeNull();
  });

  it("doesn't show anything if there's no banner type", () => {
    mockBannerStore = buildMockBannerStore(null, "don't show this banner");
    const { toJSON } = render(<RegionBannerControl />);
    expect(toJSON()).toBeNull();
  });

  it("shows an info banner correctly", () => {
    mockBannerStore = buildMockBannerStore(BannerTypes.info, "this is an info banner");
    const { getByText, getByTestId } = render(<RegionBannerControl />);
    const ctrl = getByTestId("region-banner-card");
    expect(ctrl).toHaveStyle({ backgroundColor: Palette.white });
    expect(getByText("this is an info banner")).toBeTruthy();
  });

  it("shows a warning banner correctly", () => {
    mockBannerStore = buildMockBannerStore(BannerTypes.warning, "this is a warning banner");
    const { getByText, getByTestId } = render(<RegionBannerControl />);
    const ctrl = getByTestId("region-banner-card");
    expect(ctrl).toHaveStyle({ backgroundColor: Palette.yellow });
    expect(getByText("this is a warning banner")).toBeTruthy();
  });

  it("shows a danger banner correctly", () => {
    mockBannerStore = buildMockBannerStore(BannerTypes.danger, "this is a danger banner");
    const { getByText, getByTestId } = render(<RegionBannerControl />);
    const ctrl = getByTestId("region-banner-card");
    expect(ctrl).toHaveStyle({ backgroundColor: Palette.red });
    expect(getByText("this is a danger banner")).toBeTruthy();
  });
});
