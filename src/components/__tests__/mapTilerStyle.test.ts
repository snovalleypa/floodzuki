import Constants from "expo-constants";
import { Platform } from "react-native";
import { getMapTilerKey, isSatelliteAvailable, getMapTilerHybridStyleUrl } from "../mapTilerStyle";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

jest.mock("../../config/config", () => ({
  __esModule: true,
  default: { MAPTILER_HYBRID_STYLE_URL: "https://maptiler.test/hybrid/style.json" },
}));

const setWebKey = (key: string | null) => {
  (Constants as any).expoConfig.extra.mapTilerKey = key;
};
const setNativeKey = (key: string | null) => {
  (Constants as any).expoConfig.extra.mapTilerKeyNative = key;
};
const setOS = (os: string) => {
  (Platform as any).OS = os;
};

describe("mapTilerStyle", () => {
  afterEach(() => {
    setWebKey(null);
    setNativeKey(null);
    setOS("web");
  });

  it("reports satellite unavailable and a null url when no key is set", () => {
    setWebKey(null);
    expect(getMapTilerKey()).toBeNull();
    expect(isSatelliteAvailable()).toBe(false);
    expect(getMapTilerHybridStyleUrl()).toBeNull();
  });

  it("on web, uses the web key and builds the hybrid url", () => {
    setOS("web");
    setWebKey("WEB123");
    setNativeKey("NATIVE999");
    expect(getMapTilerKey()).toBe("WEB123");
    expect(isSatelliteAvailable()).toBe(true);
    expect(getMapTilerHybridStyleUrl()).toBe("https://maptiler.test/hybrid/style.json?key=WEB123");
  });

  it("on native, uses the native key, not the web key", () => {
    setOS("ios");
    setWebKey("WEB123");
    setNativeKey("NATIVE999");
    expect(getMapTilerKey()).toBe("NATIVE999");
    expect(getMapTilerHybridStyleUrl()).toBe(
      "https://maptiler.test/hybrid/style.json?key=NATIVE999"
    );
  });

  it("on native, does NOT fall back to the web key when the native key is missing", () => {
    setOS("android");
    setWebKey("WEB123");
    setNativeKey(null);
    expect(getMapTilerKey()).toBeNull();
    expect(isSatelliteAvailable()).toBe(false);
    expect(getMapTilerHybridStyleUrl()).toBeNull();
  });

  it("treats an empty-string key as no key", () => {
    setOS("web");
    setWebKey("");
    expect(isSatelliteAvailable()).toBe(false);
    expect(getMapTilerHybridStyleUrl()).toBeNull();
  });
});
