/**
 * This file is where we do "rehydration" of your RootStore from AsyncStorage.
 * This lets you persist your state between app launches.
 *
 * Navigation state persistence is handled in navigationUtilities.tsx.
 *
 * Note that Fast Refresh doesn't play well with this file, so if you edit this,
 * do a full refresh of your app instead.
 *
 * @refresh reset
 */
import { applySnapshot, IDisposer, onSnapshot } from "mobx-state-tree";
import type { RootStore } from "../RootStore";
import * as storage from "@utils/storage";
import { loadDebugFlags } from "@utils/debugFlags";
import { loadMockReplay, isMockReplayActive } from "@services/mockReplay/mockReplayState";
import { api } from "@services/api";
import { changeLocale } from "@i18n/i18n";
import localDayJs from "@services/localDayJs";
import {
  getCacheStorageKey,
  isStaleStorageKey,
  LEGACY_ROOT_STATE_STORAGE_KEYS,
  USER_STATE_STORAGE_KEY,
} from "./storageKeys";

export const ROOT_STORE_DEFAULT = {
  isFetched: false,
};

type Snapshot = Record<string, any>;

/**
 * Splits a RootStore snapshot into the part that survives upgrades (login session +
 * preferences) and the refetchable cache. See storageKeys.ts for why.
 */
function splitSnapshot(snapshot: Snapshot) {
  const { authSessionStore, showHiddenOffline, ...cache } = snapshot;
  return { user: { authSessionStore, showHiddenOffline }, cache };
}

// MST snapshots share structure, so an unchanged subtree keeps its identity; a
// shallow identity check is enough to tell whether a half needs re-saving.
function shallowEqual(a: Snapshot | undefined, b: Snapshot) {
  if (!a) {
    return false;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Loads the user's login/prefs. On the first launch after the storage split, pulls
 * them out of the newest legacy single-key snapshot so the user stays logged in.
 */
async function loadUserState(): Promise<Snapshot> {
  const stored = await storage.load(USER_STATE_STORAGE_KEY);
  if (stored) {
    return stored;
  }
  for (const key of LEGACY_ROOT_STATE_STORAGE_KEYS) {
    const legacy = await storage.load(key);
    if (legacy) {
      const { user } = splitSnapshot(legacy);
      await storage.save(USER_STATE_STORAGE_KEY, user);
      return user;
    }
  }
  return {};
}

/**
 * Deletes caches from other app versions and the migrated legacy snapshots. Runs
 * after loadUserState so a legacy snapshot is never deleted before it's migrated.
 */
async function removeStaleKeys(currentCacheKey: string) {
  const keys = await storage.getAllKeys();
  await Promise.all(
    keys.filter((key) => isStaleStorageKey(key, currentCacheKey)).map((key) => storage.remove(key))
  );
}

/**
 * Setup the root state.
 */
let _disposer: IDisposer;
export async function setupRootStore(rootStore: RootStore) {
  let restoredState: Record<string, unknown> = {};

  await loadDebugFlags();
  await loadMockReplay();

  const cacheStorageKey = getCacheStorageKey();

  try {
    // load the last known state from AsyncStorage: user state (kept across
    // upgrades) + this version's cache (absent right after an upgrade)
    const userState = await loadUserState();
    const cacheState: Snapshot = (await storage.load(cacheStorageKey)) || {};
    await removeStaleKeys(cacheStorageKey);

    const loadedState: Snapshot = {
      ...ROOT_STORE_DEFAULT,
      ...cacheState,
      // JSON drops undefined, but a legacy migration can carry explicit undefineds
      ...Object.fromEntries(Object.entries(userState).filter(([, v]) => v !== undefined)),
    };

    // Strip any stub gauges from the cached state. Stubs are session-scoped and
    // get re-added by syncHiddenStubs after fetch. Persisting stubs causes a destroy/
    // recreate cycle when fetchData replaces the array (MST destroys unmatched
    // identifiers), and React DevTools' commit-phase diff then walks the dead old
    // stub references, spamming "Path upon death" warnings (non-fatal but noisy).
    const cachedGagesStore = (loadedState as any)?.gagesStore;
    const cachedGages: any[] = cachedGagesStore?.gages ?? [];
    restoredState = {
      ...loadedState,
      forecastsStore: {
        ...loadedState.forecastsStore,
        maxReadingId: null,
      },
      gagesStore: {
        ...(cachedGagesStore ?? {}),
        gages: cachedGages.filter((g) => !g?._isStub),
      },
      isFetched: false,
    };

    // Setup Auth Token
    // @ts-ignore
    if (loadedState?.authSessionStore?.authToken) {
      // @ts-ignore
      api.setHeader("Authorization", `Bearer ${loadedState.authSessionStore.authToken}`);
    }

    // Check the language
    if (loadedState?.authSessionStore?.preferredLocale) {
      changeLocale(loadedState.authSessionStore.preferredLocale);
      localDayJs.locale(loadedState.authSessionStore.preferredLocale);
    }

    // When a mock-replay scenario is active, boot from a clean store instead of
    // rehydrating persisted gauge/forecast data. The engine re-shifts everything
    // from scratch on fetch; reconciling the previous scenario's stale persisted
    // nodes against the freshly built ones makes React's dev-mode commit-phase
    // prop walk lazily instantiate an MST child (e.g. peakStatus) outside an
    // action, which throws the "must be done on the initializing phase" error.
    // This is the reason switching scenarios needed a second refresh. Dev-only
    // path — real sessions still rehydrate normally (auth/locale above are kept).
    applySnapshot(rootStore, isMockReplayActive() ? ROOT_STORE_DEFAULT : restoredState);

    // Stubs are stripped from the persisted snapshot (see Gage.ts postProcessSnapshot and
    // the explicit strip in this file), but `showHiddenOffline` IS persisted. Without
    // re-syncing, a session that ended with the toggle ON resumes with the toggle ON but
    // no stubs — `getLocationWithGagesIds()` returns a short list until fetchData re-syncs,
    // which causes the gauge details ChainPager to mount with an initialIndex that shifts
    // under it once stubs arrive. Route this through setShowHiddenOffline (the single
    // toggle↔stubs invariant point) rather than calling syncHiddenStubs directly; the value
    // is already true, so this is idempotent. This runs before the onSnapshot subscription
    // below, so the re-added stubs are not persisted (and postProcessSnapshot strips them
    // regardless).
    if (rootStore.showHiddenOffline) {
      rootStore.setShowHiddenOffline(true);
    }
  } catch (e) {
    // if there's any problems loading, then inform the dev what happened
    if (__DEV__) {
      console.error(e.message, null);
    }
  }

  // stop tracking state changes if we've already setup
  if (_disposer) {
    _disposer();
  }

  // track changes & save to AsyncStorage. Never persist while a mock-replay
  // scenario is active: the time-shifted data would pollute the real app's cache
  // and get rehydrated on the next (real or mock) boot, recreating the stale-
  // reconciliation crash described above.
  //
  // Each half is written only when it changed: a gauge refresh doesn't rewrite the
  // login session, and a settings change doesn't rewrite the whole gauge cache.
  let lastUser: Snapshot | undefined;
  let lastCache: Snapshot | undefined;
  _disposer = onSnapshot(rootStore, (snapshot) => {
    if (isMockReplayActive()) {
      return;
    }
    const { user, cache } = splitSnapshot(snapshot);
    if (!shallowEqual(lastUser, user)) {
      lastUser = user;
      storage.save(USER_STATE_STORAGE_KEY, user);
    }
    if (!shallowEqual(lastCache, cache)) {
      lastCache = cache;
      storage.save(cacheStorageKey, cache);
    }
  });

  const unsubscribe = () => {
    _disposer();
    _disposer = undefined;
  };

  return { rootStore, restoredState, unsubscribe };
}
