/**
 * @jest-environment jsdom
 */

// Mock modules that don't work in jsdom environment
jest.mock("expo-notifications", () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock("expo-device", () => ({
  isDevice: false,
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: jest.fn(() => ({ t: jest.fn((key) => key) })),
}));

jest.mock("@common-ui/contexts/AssetsContext", () => ({
  useAppAssets: jest.fn(),
}));

jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: jest.fn(),
  isWeb: false,
  isAndroid: true,
}));

jest.mock("@utils/navigation", () => ({
  openLinkInBrowser: jest.fn(),
}));

import { isBannerSuppressed } from "../AppStoreBanner";

const STORAGE_KEY = "install_banner_dismissed_at";

beforeEach(() => {
  localStorage.clear();
});

describe("isBannerSuppressed", () => {
  it("returns false when nothing is stored", () => {
    expect(isBannerSuppressed()).toBe(false);
  });

  it("returns true when dismissed less than 30 days ago", () => {
    const recentTimestamp = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(STORAGE_KEY, recentTimestamp);
    expect(isBannerSuppressed()).toBe(true);
  });

  it("returns false when dismissed exactly 30 days ago", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(STORAGE_KEY, thirtyDaysAgo);
    expect(isBannerSuppressed()).toBe(false);
  });

  it("returns false when dismissed more than 30 days ago", () => {
    const oldTimestamp = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(STORAGE_KEY, oldTimestamp);
    expect(isBannerSuppressed()).toBe(false);
  });

  it("returns false when stored value is not a valid date string", () => {
    localStorage.setItem(STORAGE_KEY, "not-a-date");
    expect(isBannerSuppressed()).toBe(false);
  });
});
