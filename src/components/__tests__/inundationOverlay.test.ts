import { getInundationLevels, INUNDATION_FILL_LAYER_PROPS } from "../inundationOverlay";

jest.mock("../../config/config", () => ({
  __esModule: true,
  default: { INUNDATION_GEOJSON_BASE_URL: "https://storage.googleapis.com/fz-dev-public/" },
}));

describe("getInundationLevels", () => {
  it("returns the three Carnation cfs levels in ascending order", () => {
    const levels = getInundationLevels();
    expect(levels.map((l) => l.cfs)).toEqual([20000, 32200, 42500]);
    expect(levels.map((l) => l.key)).toEqual(["minor", "moderate", "major"]);
  });

  it("builds each url from the config base + filename", () => {
    const levels = getInundationLevels();
    expect(levels[0].url).toBe(
      "https://storage.googleapis.com/fz-dev-public/FloodExtent_20000CFS_fixed_simplified.geojson"
    );
    expect(levels[2].url).toBe(
      "https://storage.googleapis.com/fz-dev-public/FloodExtent_42500CFS_fixed_simplified.geojson"
    );
  });

  it("maps each level to its i18n label key", () => {
    expect(getInundationLevels().map((l) => l.labelTx)).toEqual([
      "map.levelMinor",
      "map.levelModerate",
      "map.levelMajor",
    ]);
  });
});

describe("INUNDATION_FILL_LAYER_PROPS", () => {
  it("is a fill layer", () => {
    expect(INUNDATION_FILL_LAYER_PROPS.type).toBe("fill");
    expect(INUNDATION_FILL_LAYER_PROPS.id).toBe("inundation-fill");
  });
});
