import React from "react";
import { render } from "@testing-library/react-native";

// Import after mocks are set up. Use a RELATIVE path: the jest config maps only the
// `@<alias>/*` paths and there is no `roots`/`moduleDirectories` entry for the project
// root, so a bare `app/...` specifier will NOT resolve.
import GageScreen from "../../../app/(root)/gage/[id]";

const setShowHiddenOffline = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  Link: ({ children }: any) => children,
  Stack: { Screen: () => null },
  useRouter: () => ({ setParams: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

jest.mock("expo-router/head", () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

// Minimal stub store; only the fields GageScreen reads.
const buildMockStores = (overrides: Partial<any> = {}) => ({
  setShowHiddenOffline,
  showHiddenOffline: false,
  isHiddenLocation: jest.fn().mockReturnValue(false),
  getLocationWithGagesIds: jest.fn().mockReturnValue([]),
  gagesStore: { getGageByLocationId: jest.fn(), fetchData: jest.fn() },
  regionStore: { region: null },
  ...overrides,
});

let mockStores: ReturnType<typeof buildMockStores>;

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => mockStores,
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));

// The screen renders heavy children (charts, maps). Stub them so the test stays
// focused on the auto-toggle behavior.
jest.mock("@components/ChainPager", () => ({
  ChainPager: () => null,
  ChainPagerContext: { Provider: ({ children }: any) => children },
}));
jest.mock("@common-ui/components/EmptyComponent", () => ({
  __esModule: true,
  default: () => null,
}));

// Additional mocks needed to prevent module load failures from heavy imports
jest.mock("mobx-react-lite", () => ({
  observer: (fn: any) => fn,
}));

jest.mock("@utils/useTimeout", () => ({
  useTimeout: jest.fn(),
}));

jest.mock("@utils/useGoBack", () => ({
  useGoBack: () => jest.fn(),
}));

jest.mock("@common-ui/utils/responsive", () => ({
  isWeb: false,
  isMobile: true,
  useResponsive: () => ({ isMobile: true }),
  MobileScreen: ({ children }: any) => children,
  WideScreen: () => null,
}));

jest.mock("@components/GageDetailsChart", () => ({
  GageDetailsChart: () => null,
}));

jest.mock("@components/CalloutReadingCard", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/GageImageCard", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/GageInfoCard", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/StatusLevelsCard", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/GageMap", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@components/ErrorDetails", () => ({
  ErrorDetails: () => null,
}));

jest.mock("@common-ui/components/Button", () => ({
  IconButton: () => null,
  LinkButton: () => null,
}));

jest.mock("@common-ui/components/Label", () => ({
  Label: () => null,
}));

jest.mock("app/_layout", () => ({
  ROUTES: {
    GageDetails: "/gage/[id]",
    Home: "/",
  },
}));

describe("GageScreen auto-toggle on hidden gauge deep link", () => {
  beforeEach(() => {
    setShowHiddenOffline.mockReset();
    mockUseLocalSearchParams.mockReturnValue({ id: "SVPA-29" });
  });

  it("enables showHiddenOffline when URL targets a hidden gauge", () => {
    mockStores = buildMockStores({
      isHiddenLocation: jest.fn((id: string) => id === "SVPA-29"),
      getLocationWithGagesIds: jest.fn().mockReturnValue(["USGS-38", "USGS-22"]),
    });

    render(<GageScreen />);

    expect(mockStores.isHiddenLocation).toHaveBeenCalledWith("SVPA-29");
    expect(setShowHiddenOffline).toHaveBeenCalledWith(true);
  });

  it("does NOT toggle when URL targets a visible gauge", () => {
    mockStores = buildMockStores({
      isHiddenLocation: jest.fn().mockReturnValue(false),
      getLocationWithGagesIds: jest.fn().mockReturnValue(["USGS-38", "USGS-22"]),
    });
    mockUseLocalSearchParams.mockReturnValue({ id: "USGS-22" });

    render(<GageScreen />);

    expect(setShowHiddenOffline).not.toHaveBeenCalled();
  });

  it("does NOT toggle when URL targets an unknown gauge", () => {
    mockStores = buildMockStores({
      isHiddenLocation: jest.fn().mockReturnValue(false), // unknown → not hidden
      getLocationWithGagesIds: jest.fn().mockReturnValue(["USGS-38", "USGS-22"]),
    });
    mockUseLocalSearchParams.mockReturnValue({ id: "USGS-9999" });

    render(<GageScreen />);

    expect(setShowHiddenOffline).not.toHaveBeenCalled();
  });
});
