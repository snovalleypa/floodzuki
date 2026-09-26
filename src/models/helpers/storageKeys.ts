import Constants from "expo-constants";
import * as Updates from "expo-updates";

/**
 * Persisted RootStore state is split across two keys:
 *
 * - USER_STATE_STORAGE_KEY holds what the user would be upset to lose: the login
 *   session (authSessionStore) and preferences. It survives app upgrades, so any
 *   shape change here needs a migration (bump the key and read the old one).
 * - The cache key holds everything refetchable (gauges, readings, forecasts,
 *   region). It is tied to the app version + OTA update, so every release starts
 *   with a fresh cache and never has to read an older build's data shape.
 *
 * Keys are namespaced with "store-" because on web AsyncStorage is the origin's
 * shared localStorage; cleanup must never touch keys it doesn't own.
 */
export const USER_STATE_STORAGE_KEY = "store-user-v1";

// Single-key snapshots written by builds before the split, newest first. Only read
// to migrate the user's login/prefs, then deleted.
export const LEGACY_ROOT_STATE_STORAGE_KEYS = ["root-v3", "root-v2"];

const CACHE_STORAGE_KEY_PREFIX = "store-cache-";

export function getCacheStorageKey(): string {
  const version = Constants.expoConfig?.version ?? "unknown";
  // null for the JS bundle embedded in the binary (and in dev); an OTA update gets
  // its own id, so JS-only releases also start with a fresh cache.
  const updateId = Updates.updateId ?? "embedded";
  return `${CACHE_STORAGE_KEY_PREFIX}${version}-${updateId}`;
}

export function isStaleStorageKey(key: string, currentCacheKey: string): boolean {
  if (LEGACY_ROOT_STATE_STORAGE_KEYS.includes(key)) {
    return true;
  }
  return key.startsWith(CACHE_STORAGE_KEY_PREFIX) && key !== currentCacheKey;
}
