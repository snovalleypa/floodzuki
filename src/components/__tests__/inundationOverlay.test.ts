import {
  fetchInundationLevels,
  getLevelsConfigUrl,
  localizeLevelLabel,
  INUNDATION_FILL_LAYER_PROPS,
} from "../inundationOverlay";

jest.mock("../../config/config", () => ({
  __esModule: true,
  default: { INUNDATION_GEOJSON_BASE_URL: "https://storage.googleapis.com/fz-dev-public/" },
}));

const BASE = "https://storage.googleapis.com/fz-dev-public/";

function mockFetch(body: unknown, ok = true) {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok, json: async () => body }) as never;
}

const config = {
  levels: [
    {
      key: "minor",
      label: { en: "Minor", es: "Menor" },
      cfs: 20000,
      file: "FloodExtent_20000CFS_fixed_simplified.geojson",
      roadClosuresFile: "RoadClosures_20000CFS.geojson",
    },
    {
      key: "major",
      label: { en: "Major", es: "Mayor" },
      cfs: 42500,
      file: "FloodExtent_42500CFS_fixed_simplified.geojson",
    },
  ],
};

describe("getLevelsConfigUrl", () => {
  it("builds the per-region config url", () => {
    expect(getLevelsConfigUrl(1)).toBe(BASE + "flood-viz-levels-region-1.json");
  });
});

describe("fetchInundationLevels", () => {
  it("fetches the region config and builds each url from base + file", async () => {
    mockFetch(config);
    const levels = await fetchInundationLevels(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(BASE + "flood-viz-levels-region-1.json");
    expect(levels?.map((l) => l.key)).toEqual(["minor", "major"]);
    expect(levels?.[0].url).toBe(BASE + "FloodExtent_20000CFS_fixed_simplified.geojson");
    expect(levels?.[0].label).toEqual({ en: "Minor", es: "Menor" });
  });

  it("builds roadClosuresUrl from base + roadClosuresFile, or null when absent", async () => {
    mockFetch(config);
    const levels = await fetchInundationLevels(1);
    expect(levels?.[0].roadClosuresUrl).toBe(BASE + "RoadClosures_20000CFS.geojson");
    expect(levels?.[1].roadClosuresUrl).toBeNull();
  });

  it("accepts a bare array config too", async () => {
    mockFetch(config.levels);
    const levels = await fetchInundationLevels(1);
    expect(levels?.map((l) => l.cfs)).toEqual([20000, 42500]);
  });

  it("returns null when the config is missing (404)", async () => {
    mockFetch(null, false);
    expect(await fetchInundationLevels(2)).toBeNull();
  });

  it("returns null when the body has the wrong shape", async () => {
    mockFetch({ nope: true });
    expect(await fetchInundationLevels(1)).toBeNull();
  });

  it("returns null on a network error", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("offline")) as never;
    expect(await fetchInundationLevels(1)).toBeNull();
  });
});

describe("localizeLevelLabel", () => {
  const label = { en: "Minor", es: "Menor" };

  it("picks the active locale", () => {
    expect(localizeLevelLabel(label, "es")).toBe("Menor");
  });

  it("uses the base language of a regional locale", () => {
    expect(localizeLevelLabel(label, "en-US")).toBe("Minor");
  });

  it("falls back to english, then to any value present", () => {
    expect(localizeLevelLabel(label, "fr")).toBe("Minor");
    expect(localizeLevelLabel({ de: "Gering" }, "fr")).toBe("Gering");
  });
});

describe("INUNDATION_FILL_LAYER_PROPS", () => {
  it("is a fill layer", () => {
    expect(INUNDATION_FILL_LAYER_PROPS.type).toBe("fill");
    expect(INUNDATION_FILL_LAYER_PROPS.id).toBe("inundation-fill");
  });
});
