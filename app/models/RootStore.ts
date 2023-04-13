import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { ForecastStoreModel } from "./Forecasts"
import { GageStoreModel } from "./Gage"
import { GageReadingStoreModel } from "./GageReading"
import { LocationInfoModelStore } from "./LocationInfo"
import { MetagageModelStore } from "./Metagage"
import { RegionModelStore } from "./Region"

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore")
  .props({
    isFetched: types.optional(types.boolean, false),
    gagesStore: types.optional(GageStoreModel, {}),
    gageReadingsStore: types.optional(GageReadingStoreModel, {}),
    regionStore: types.optional(RegionModelStore, {}),
    metagageStore: types.optional(MetagageModelStore, {}),
    locationInfoStore: types.optional(LocationInfoModelStore, {}),
    forecastsStore: types.optional(ForecastStoreModel, {}),
  })
  .actions(store => {
    const setIsFetched = (isFetching: boolean) => {
      store.isFetched = isFetching
    }

    const fetchMainData = flow(function*() {
      setIsFetched(false)

      yield store.regionStore.fetchData()
      yield store.locationInfoStore.fetchData()
      yield store.metagageStore.fetchData()
      yield store.gagesStore.fetchData()
      yield store.forecastsStore.fetchData()

      setIsFetched(true)
    })

    return {
      fetchMainData,
    }
  })
  .views(store => {
    const getForecastGage = (gageId: string) => {
      const metaGage = store.metagageStore.metagages.find(gage => gage.id === gageId)
      
      if (metaGage) {
        return metaGage.getForecastGage()
      }

      const gage = store.forecastsStore.forecasts.get(gageId)

      if (gage) {
        return gage.getForecastGage()
      }

      return null
    }

    const getForecastGages = (gageIds: string[]) => {
      return gageIds.map(id => getForecastGage(id)).filter(gage => gage !== null)
    }

    const getForecasts = (gageIds: string[]) => {
      return gageIds.map(id => store.forecastsStore.getForecast(id)).filter(forecast => !!forecast)
    }

    const getTimezone = () => {
      return store.regionStore?.region?.timezone || 'America/Los_Angeles'
    }

    const getLocationsWithGages = () => {
      const gages = store.gagesStore.gages.map(gage => gage.locationId)
      return store.locationInfoStore.locationInfos.filter(location => gages.includes(location.id))
    }

    const getUpstreamGageLocation = (locationId: string) => {
      if (!locationId) {
        return null
      }

      const locations = getLocationsWithGages()

      const gageIndex = locations.findIndex(l => l.id === locationId);

      return gageIndex > 0 && locations[gageIndex - 1];
    }

    const getDownstreamGageLocation = (locationId: string) => {
      if (!locationId) {
        return null
      }

      const locations = getLocationsWithGages()

      const gageIndex = locations.findIndex(l => l.id === locationId);
      
      return gageIndex >= 0 &&
        gageIndex + 1 < locations.length &&
        locations[gageIndex + 1];
    }

    return {
      getForecastGage,
      getForecastGages,
      getForecasts,
      getTimezone,
      getLocationsWithGages,
      getUpstreamGageLocation,
      getDownstreamGageLocation,

      get isDataFetched() {
        return store.isFetched
      }
    }
  })

/**
 * Common interfaces used across stores and app
 */

export interface GageSummary {
  id: string,
  nwrfcId: string,
  title: string,
  warningDischarge: number,
  floodDischarge: number,
  isMetagage: boolean,
}

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
