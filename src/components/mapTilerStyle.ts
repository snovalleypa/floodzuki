import Constants from "expo-constants";
import Config from "../config/config";

// The MapTiler API key is injected at build time from MAP_TILER_KEY via
// app.config.ts `extra`. When it is absent (e.g. local dev without the key),
// the satellite base layer is not offered at all.
export function getMapTilerKey(): string | null {
  const key = Constants.expoConfig?.extra?.mapTilerKey as string | undefined;
  return key ? key : null;
}

export function isSatelliteAvailable(): boolean {
  return Boolean(getMapTilerKey());
}

// MapTiler's ready-made "hybrid" style is satellite imagery + street/place
// labels, and is a MapLibre-compatible style.json. Returns null when no key is
// available so callers can fall back to the vector basemap.
export function getMapTilerHybridStyleUrl(): string | null {
  const key = getMapTilerKey();
  if (!key) {
    return null;
  }
  return `${Config.MAPTILER_HYBRID_STYLE_URL}?key=${key}`;
}
