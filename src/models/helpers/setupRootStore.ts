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
import { api } from "@services/api";
import { changeLocale } from "@i18n/i18n";
import localDayJs from "@services/localDayJs";

/**
 * The key we'll be saving our state as within async storage.
 */
const ROOT_STATE_STORAGE_KEY = "root-v2";

export const ROOT_STORE_DEFAULT = {
  isFetched: false,
};

/**
 * Setup the root state.
 */
let _disposer: IDisposer;
export async function setupRootStore(rootStore: RootStore) {
  let restoredState: Record<string, unknown> = {};

  try {
    // load the last known state from AsyncStorage
    const loadedState: RootStore =
      (await storage.load(ROOT_STATE_STORAGE_KEY)) || ROOT_STORE_DEFAULT;

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

    applySnapshot(rootStore, restoredState);

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

  // track changes & save to AsyncStorage
  _disposer = onSnapshot(rootStore, (snapshot) => storage.save(ROOT_STATE_STORAGE_KEY, snapshot));

  const unsubscribe = () => {
    _disposer();
    _disposer = undefined;
  };

  return { rootStore, restoredState, unsubscribe };
}
