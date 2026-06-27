import Constants from "expo-constants";
import { getMapTilerKey, isSatelliteAvailable, getMapTilerHybridStyleUrl } from "../mapTilerStyle";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock("../../config/config", () => ({
  __esModule: true,
  default: { MAPTILER_HYBRID_STYLE_URL: "https://maptiler.test/hybrid/style.json" },
}));

const setKey = (key: string | null) => {
  (Constants as any).expoConfig.extra.mapTilerKey = key;
};

describe("mapTilerStyle", () => {
  afterEach(() => setKey(null));

  it("reports satellite unavailable and a null url when no key is set", () => {
    setKey(null);
    expect(getMapTilerKey()).toBeNull();
    expect(isSatelliteAvailable()).toBe(false);
    expect(getMapTilerHybridStyleUrl()).toBeNull();
  });

  it("reports available and builds the hybrid url with the key when set", () => {
    setKey("ABC123");
    expect(getMapTilerKey()).toBe("ABC123");
    expect(isSatelliteAvailable()).toBe(true);
    expect(getMapTilerHybridStyleUrl()).toBe("https://maptiler.test/hybrid/style.json?key=ABC123");
  });

  it("treats an empty-string key as no key", () => {
    setKey("");
    expect(isSatelliteAvailable()).toBe(false);
    expect(getMapTilerHybridStyleUrl()).toBeNull();
  });
});
