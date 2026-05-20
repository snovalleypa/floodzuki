import type { FeatureCollection } from "geojson";
import type { LineLayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import snoqualmieRivers from "./snoqualmieRivers.geojson.json";

const EMPTY_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function getRiverOverlaysGeoJson(regionId: number | undefined): FeatureCollection {
  if (regionId === 1) {
    return snoqualmieRivers as FeatureCollection;
  }
  return EMPTY_GEOJSON;
}

export const RIVER_OVERLAY_LAYER_PROPS: Omit<LineLayerSpecification, "source"> = {
  id: "region-rivers-line",
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": "hsla(205, 68%, 57%, 0.81)",
    "line-opacity": 1,
    "line-width": ["interpolate", ["exponential", 1.4], ["zoom"], 5, 2, 10, 6, 14, 10, 20, 18],
  },
};
