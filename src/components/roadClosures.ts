import type {
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import { Colors } from "@common-ui/constants/colors";

// Road segments that flood at each inundation level. The GeoJSON for each level
// is served from the same bucket as the FloodExtent files; the per-level road URL
// comes from the region config (`roadClosuresFile` on each level — see
// inundationOverlay.ts), so the level→file mapping is not hardcoded here. Each
// feature carries a semantic `status` ("normal" | "nearFlooding" | "flooding")
// and a `label` — the line layer maps the status to a gauge-status color in code
// (below), so the color is not baked into the GeoJSON.

// Single line layer for all levels. The color is data-driven from each feature's
// `status`, mapped here to the app's gauge-status palette (the single source of
// truth in colors.ts) so hex values never live in the GeoJSON. Declared above
// the inundation fill so the highlighted road reads on top of the flood area.
export const ROAD_CLOSURE_LINE_LAYER_PROPS: Omit<LineLayerSpecification, "source"> = {
  id: "road-closures-line",
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": [
      "match",
      ["get", "status"],
      "normal",
      Colors.success, // green
      "nearFlooding",
      Colors.warning, // yellow
      "flooding",
      Colors.danger, // red
      Colors.warning, // fallback for an unknown status
    ],
    "line-width": 4,
    "line-opacity": 1,
  },
};

// A single centered label per road, riding along the line (e.g. "NE 124th -
// Possible Closure" at the minor level, "NE 124th - Closed" above). Text is dark
// with a white halo for legibility over the flood fill and basemap — the line
// color already signals severity, so the label stays readable rather than tinted.
export const ROAD_CLOSURE_LABEL_LAYER_PROPS: Omit<SymbolLayerSpecification, "source"> = {
  id: "road-closures-label",
  type: "symbol",
  layout: {
    "text-field": ["get", "label"],
    "text-font": ["Noto Sans Regular"],
    "symbol-placement": "line-center",
    "text-max-width": 12,
    "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 14, 14],
  },
  paint: {
    "text-color": "hsl(0, 0%, 8%)",
    "text-halo-color": "white",
    "text-halo-width": 2,
  },
};
