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
import { applySnapshot, IDisposer, onSnapshot } from "mobx-state-tree"
import type { RootStore } from "../RootStore"
import * as storage from "@utils/storage"
import { api } from "@services/api"
import { changeLocale } from "@i18n/i18n"
import localDayJs from "@services/localDayJs"

/**
 * The key we'll be saving our state as within async storage.
 */
const ROOT_STATE_STORAGE_KEY = "root-v1"

export const ROOT_STORE_DEFAULT = {
  isFetched: false,
}

/**
 * Setup the root state.
 */
let _disposer: IDisposer
export async function setupRootStore(rootStore: RootStore) {
  let restoredState: Record<string, unknown> = {}

  try {
    // load the last known state from AsyncStorage
    const loadedState: RootStore = ROOT_STORE_DEFAULT as RootStore

    restoredState = {
      ...loadedState,
      forecastsStore: {
        ...loadedState.forecastsStore,
        maxReadingId: null
      },
      isFetched: false,
    }

    // Setup Auth Token
    // @ts-ignore
    if (loadedState?.authSessionStore?.authToken) {
      // @ts-ignore
      api.setHeader("Authorization", `Bearer ${loadedState.authSessionStore.authToken}`)
    }

    // Check the language
    if (loadedState?.authSessionStore?.preferredLocale) {
      changeLocale(loadedState.authSessionStore.preferredLocale)
      localDayJs.locale(loadedState.authSessionStore.preferredLocale)
    }

    applySnapshot(rootStore, restoredState)
  } catch (e) {
    // if there's any problems loading, then inform the dev what happened
    if (__DEV__) {
      console.error(e.message, null)
    }
  }

  // stop tracking state changes if we've already setup
  if (_disposer) _disposer()

  // track changes & save to AsyncStorage
  _disposer = onSnapshot(rootStore, (snapshot) => storage.save(ROOT_STATE_STORAGE_KEY, snapshot))

  const unsubscribe = () => {
    _disposer()
    _disposer = undefined
  }

  return { rootStore, restoredState, unsubscribe }
}
