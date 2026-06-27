import { Platform } from "react-native";
import Constants from "expo-constants";
import Config from "../config/config";

// MapTiler keys are restricted differently per platform: the web key is locked
// to allowed domains (the browser sends a Referer), while native apps can't send
// a Referer, so they use a separate key locked to an allowed User-Agent substring
// (see MapLibreMobileGageMap, which sets that User-Agent). We therefore pick the
// key by platform and never fall back across platforms — a web key would 403 on
// native and vice-versa. Both come from app.config.ts `extra` (MAP_TILER_KEY /
// MAP_TILER_KEY_NATIVE). When the platform's key is absent (e.g. local dev), the
// satellite base layer is not offered.
export function getMapTilerKey(): string | null {
  const extra = Constants.expoConfig?.extra;
  const key = (Platform.OS === "web" ? extra?.mapTilerKey : extra?.mapTilerKeyNative) as
    | string
    | undefined;
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
