import type { FeatureCollection, Point } from "geojson";
import type { SymbolLayerSpecification } from "@maplibre/maplibre-gl-style-spec";

export interface TownLabelInfo {
  name: string;
  latitude: number;
  longitude: number;
}

const TOWN_LABELS_BY_REGION: Record<number, TownLabelInfo[]> = {
  // Region 1: Snoqualmie Valley
  1: [
    { name: "Monroe", latitude: 47.8557, longitude: -121.9714 },
    { name: "Duvall", latitude: 47.7423, longitude: -121.9851 },
    { name: "Carnation", latitude: 47.6489, longitude: -121.9143 },
    { name: "Fall City", latitude: 47.5723, longitude: -121.887 },
    { name: "Snoqualmie", latitude: 47.5301, longitude: -121.8254 },
    { name: "North Bend", latitude: 47.4954, longitude: -121.7868 },
  ],
};

const EMPTY_GEOJSON: FeatureCollection<Point, { name: string }> = {
  type: "FeatureCollection",
  features: [],
};

export function getTownLabelsGeoJson(
  regionId: number | undefined
): FeatureCollection<Point, { name: string }> {
  if (regionId === undefined) {
    return EMPTY_GEOJSON;
  }
  const towns = TOWN_LABELS_BY_REGION[regionId];
  if (!towns) {
    return EMPTY_GEOJSON;
  }
  return {
    type: "FeatureCollection",
    features: towns.map((town) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [town.longitude, town.latitude] },
      properties: { name: town.name },
    })),
  };
}

export const TOWN_LABELS_LAYER_PROPS: Omit<SymbolLayerSpecification, "source"> = {
  id: "region-towns-labels",
  type: "symbol",
  maxzoom: 9,
  layout: {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-anchor": "center",
    "text-max-width": 6,
    "text-size": ["interpolate", ["linear"], ["zoom"], 6, 12, 9, 14],
  },
  paint: {
    "text-color": "hsl(0, 0%, 8%)",
    "text-halo-color": "white",
    "text-halo-width": 2,
  },
};
