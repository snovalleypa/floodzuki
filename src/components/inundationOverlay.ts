import type { FillLayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import Config from "@config/config";

export type InundationLevel = {
  key: string;
  // Display label per locale, e.g. { en: "Minor", es: "Menor" }. Resolved for the
  // active locale by localizeLevelLabel. Lives in the remote config so levels are
  // fully data-driven (no app i18n key needed to add one).
  label: Record<string, string>;
  cfs: number;
  // Gauge height in feet at this level, or null when the config omits it.
  feet: number | null;
  // GeoJSON URL of the flood-extent fill for this level.
  url: string;
  // GeoJSON URL of the road closures shown at this level, or null when the config
  // doesn't list a road file for it.
  roadClosuresUrl: string | null;
};

// The region config file's shape (untrusted input — fields are validated before
// use). Accepts either a bare array of levels or a { levels: [...] } wrapper.
type RawLevel = {
  key?: string;
  label?: Record<string, string>;
  cfs?: number;
  feet?: number;
  file?: string;
  roadClosuresFile?: string;
};
type RawConfig = { levels?: RawLevel[] } | RawLevel[] | null;

function baseUrl(): string {
  const base = Config.INUNDATION_GEOJSON_BASE_URL;
  return base.endsWith("/") ? base : base + "/";
}

// URL of the per-region level config, served from the same bucket as the
// FloodExtent GeoJSON, e.g. ".../flood-viz-levels-region-1.json".
export function getLevelsConfigUrl(regionId: number): string {
  return `${baseUrl()}flood-viz-levels-region-${regionId}.json`;
}

// Fetch and normalize the inundation levels for a region. Returns null when the
// config is absent (404) or unusable (network/parse error, wrong shape) — the
// caller hides the Flood Visualizer control in that case. Never rejects.
export async function fetchInundationLevels(regionId: number): Promise<InundationLevel[] | null> {
  const base = baseUrl();
  let res: Response;
  try {
    res = await fetch(getLevelsConfigUrl(regionId));
  } catch {
    return null;
  }
  if (!res.ok) {
    return null;
  }
  let data: RawConfig;
  try {
    data = (await res.json()) as RawConfig;
  } catch {
    return null;
  }
  const raw = Array.isArray(data) ? data : data?.levels;
  if (!Array.isArray(raw)) {
    return null;
  }
  const levels = raw
    .filter(
      (l): l is RawLevel & { key: string; file: string } =>
        typeof l?.key === "string" && typeof l?.file === "string"
    )
    .map((l) => ({
      key: l.key,
      label: l.label && typeof l.label === "object" ? l.label : {},
      cfs: typeof l.cfs === "number" ? l.cfs : 0,
      feet: typeof l.feet === "number" ? l.feet : null,
      url: base + l.file,
      roadClosuresUrl: l.roadClosuresFile ? base + l.roadClosuresFile : null,
    }));
  return levels.length > 0 ? levels : null;
}

// Resolve a level's localized label, falling back from the active locale's base
// language (e.g. "en-US" -> "en") to English to whatever's present.
export function localizeLevelLabel(label: Record<string, string>, locale: string): string {
  if (!label) {
    return "";
  }
  const lang = (locale || "en").split("-")[0];
  return label[lang] ?? label.en ?? Object.values(label)[0] ?? "";
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
