import type { FillLayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import Config from "@config/config";

export type InundationLevel = {
  key: string;
  labelTx: string;
  cfs: number;
  url: string;
};

const LEVEL_FILES: { key: string; labelTx: string; cfs: number; file: string }[] = [
  {
    key: "minor",
    labelTx: "map.levelMinor",
    cfs: 20000,
    file: "FloodExtent_20000CFS_fixed_simplified.geojson",
  },
  {
    key: "moderate",
    labelTx: "map.levelModerate",
    cfs: 32200,
    file: "FloodExtent_32200CFS_fixed_simplified.geojson",
  },
  {
    key: "major",
    labelTx: "map.levelMajor",
    cfs: 42500,
    file: "FloodExtent_42500CFS_fixed_simplified.geojson",
  },
];

function baseUrl(): string {
  const base = Config.INUNDATION_GEOJSON_BASE_URL;
  return base.endsWith("/") ? base : base + "/";
}

export function getInundationLevels(): InundationLevel[] {
  const base = baseUrl();
  return LEVEL_FILES.map(({ key, labelTx, cfs, file }) => ({
    key,
    labelTx,
    cfs,
    url: base + file,
  }));
}

// Single translucent fill shared by all levels (only one is shown at a time).
// Declared beneath the river/town overlays so those annotations remain visible.
export const INUNDATION_FILL_LAYER_PROPS: Omit<FillLayerSpecification, "source"> = {
  id: "inundation-fill",
  type: "fill",
  paint: {
    "fill-color": "rgba(30, 120, 200, 0.35)",
    "fill-outline-color": "rgba(20, 90, 160, 0.9)",
  },
};
