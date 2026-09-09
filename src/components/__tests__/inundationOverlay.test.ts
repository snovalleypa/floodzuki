import {
  fetchInundationConfig,
  getLevelsConfigUrl,
  localizeLevelLabel,
  INUNDATION_FILL_LAYER_PROPS,
  MODEL_BOUNDARY_LINE_LAYER_PROPS,
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
  modelBoundaryFile: "ModelBoundary.geojson",
  levels: [
    {
      key: "minor",
      label: { en: "Minor", es: "Menor" },
      cfs: 20000,
      file: "FloodExtent_20000CFS_fixed_simplified.geojson",
      roadClosuresFile: "RoadClosures_20000CFS.geojson",
      feet: 53.69,
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

describe("fetchInundationConfig", () => {
  it("fetches the region config and builds each url from base + file", async () => {
    mockFetch(config);
    const result = await fetchInundationConfig(1);
    const levels = result?.levels;
    expect(globalThis.fetch).toHaveBeenCalledWith(BASE + "flood-viz-levels-region-1.json");
    expect(levels?.map((l) => l.key)).toEqual(["minor", "major"]);
    expect(levels?.[0].url).toBe(BASE + "FloodExtent_20000CFS_fixed_simplified.geojson");
    expect(levels?.[0].label).toEqual({ en: "Minor", es: "Menor" });
  });

  it("builds roadClosuresUrl from base + roadClosuresFile, or null when absent", async () => {
    mockFetch(config);
    const levels = (await fetchInundationConfig(1))?.levels;
    expect(levels?.[0].roadClosuresUrl).toBe(BASE + "RoadClosures_20000CFS.geojson");
    expect(levels?.[1].roadClosuresUrl).toBeNull();
  });

  it("parses the gauge height in feet, or null when absent", async () => {
    mockFetch(config);
    const levels = (await fetchInundationConfig(1))?.levels;
    expect(levels?.[0].feet).toBe(53.69);
    expect(levels?.[1].feet).toBeNull();
  });

  it("builds modelBoundaryUrl from base + modelBoundaryFile", async () => {
    mockFetch(config);
    const result = await fetchInundationConfig(1);
    expect(result?.modelBoundaryUrl).toBe(BASE + "ModelBoundary.geojson");
  });

  it("returns a null modelBoundaryUrl when the config doesn't list one", async () => {
    mockFetch({ levels: config.levels });
    const result = await fetchInundationConfig(1);
    expect(result?.modelBoundaryUrl).toBeNull();
  });

  it("accepts a bare array config too (no model boundary in that form)", async () => {
    mockFetch(config.levels);
    const result = await fetchInundationConfig(1);
    expect(result?.levels.map((l) => l.cfs)).toEqual([20000, 42500]);
    expect(result?.modelBoundaryUrl).toBeNull();
  });

  it("returns null when the config is missing (404)", async () => {
    mockFetch(null, false);
    expect(await fetchInundationConfig(2)).toBeNull();
  });

  it("returns null when the body has the wrong shape", async () => {
    mockFetch({ nope: true });
    expect(await fetchInundationConfig(1)).toBeNull();
  });

  it("returns null on a network error", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("offline")) as never;
    expect(await fetchInundationConfig(1)).toBeNull();
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

describe("MODEL_BOUNDARY_LINE_LAYER_PROPS", () => {
  it("is a line layer (outline only — the boundary's interior must not be shaded)", () => {
    expect(MODEL_BOUNDARY_LINE_LAYER_PROPS.type).toBe("line");
    expect(MODEL_BOUNDARY_LINE_LAYER_PROPS.id).toBe("model-boundary-line");
  });
});
