import { flow, Instance, SnapshotOut, types } from "mobx-state-tree";
import { ForecastStoreModel } from "./Forecasts";
import { GageStoreModel } from "./Gage";
import { GageReadingStoreModel } from "./GageReading";
import { LocationInfoModelStore } from "./LocationInfo";
import { RegionModelStore } from "./Region";
import { AuthSessionStoreModel } from "./AuthSession";
import { computeBucketCounts } from "./helpers/regionSummary";

/**
 * A RootStore model.
 */
export const RootStoreModel = types
  .model("RootStore")
  .props({
    isFetched: types.optional(types.boolean, false),
    showHiddenOffline: types.optional(types.boolean, false),
    gagesStore: types.optional(GageStoreModel, {}),
    gageReadingsStore: types.optional(GageReadingStoreModel, {}),
    regionStore: types.optional(RegionModelStore, {}),
    locationInfoStore: types.optional(LocationInfoModelStore, {}),
    forecastsStore: types.optional(ForecastStoreModel, {}),
    authSessionStore: types.optional(AuthSessionStoreModel, {}),
  })
  .actions((store) => {
    const setIsFetched = (isFetching: boolean) => {
      store.isFetched = isFetching;
    };

    const setShowHiddenOffline = (value: boolean) => {
      store.showHiddenOffline = value;
      store.gagesStore.syncHiddenStubs(value, store.locationInfoStore.locationInfos);
    };

    const fetchMainData = flow(function* () {
      setIsFetched(false);

      yield store.regionStore.fetchData();
      yield store.locationInfoStore.fetchData();
      yield store.gagesStore.fetchData();
      yield store.forecastsStore.fetchData();

      setIsFetched(true);
    });

    return {
      fetchMainData,
      setShowHiddenOffline,
    };
  })
  .views((store) => {
    const getForecastGage = (gageId: string) => {
      const gage = store.forecastsStore.forecasts.get(gageId);

      if (gage) {
        return gage?.forecastGage;
      }

      return null;
    };

    const getForecastGages = (gageIds: string[]) => {
      return gageIds.map((id) => getForecastGage(id)).filter((gage) => gage !== null);
    };

    const getForecasts = (gageIds: string[]) => {
      return gageIds
        .map((id) => store.forecastsStore.getForecast(id))
        .filter((forecast) => !!forecast);
    };

    const getTimezone = () => {
      return store.regionStore?.region?.timezone || "America/Los_Angeles";
    };

    const filterLocationsWithGages = () => {
      const gages = store.gagesStore.gages;
      const gageIds = gages.map((gage) => gage.locationId);

      return store.locationInfoStore.locationInfos.filter((location) =>
        gageIds.includes(location.id)
      );
    };

    const getLocationsWithGages = () => {
      const gages = store.gagesStore.gages;
      const gageIds = gages.map((gage) => gage.locationId);

      return store.locationInfoStore.locationInfos
        .filter((location) => gageIds.includes(location.id))
        .map((location) => gages.find((gage) => gage.locationId === location.id));
    };

    const getLocationWithGagesIds = () => {
      const gages = store.gagesStore.gages.map((gage) => gage.locationId);
      return store.locationInfoStore.locationInfos
        .filter((location) => gages.includes(location.id))
        .map((location) => location.id);
    };

    const realLocations = () => store.locationInfoStore.locationInfos.filter((l) => !l.isMetagage);

    const hiddenLocations = () => {
      const realGageIds = new Set(
        store.gagesStore.gages.filter((g) => !g._isStub).map((g) => g.locationId)
      );
      return realLocations().filter((l) => !realGageIds.has(l.id));
    };

    const getBucketCounts = () =>
      computeBucketCounts({
        gages: store.gagesStore.gages,
        locationInfos: store.locationInfoStore.locationInfos,
      });

    const navLocations = () => {
      if (store.showHiddenOffline) {
        return realLocations();
      }
      return filterLocationsWithGages();
    };

    const getUpstreamGageLocation = (locationId: string) => {
      if (!locationId) {
        return null;
      }
      const locations = navLocations();
      const gageIndex = locations.findIndex((location) => location.id === locationId);
      return gageIndex > 0 && locations[gageIndex - 1];
    };

    const getDownstreamGageLocation = (locationId: string) => {
      if (!locationId) {
        return null;
      }
      const locations = navLocations();
      const gageIndex = locations.findIndex((location) => location.id === locationId);
      return gageIndex >= 0 && gageIndex + 1 < locations.length && locations[gageIndex + 1];
    };

    return {
      getForecastGage,
      getForecastGages,
      getForecasts,
      getTimezone,
      getLocationsWithGages,
      getLocationWithGagesIds,
      getUpstreamGageLocation,
      getDownstreamGageLocation,
      realLocations,
      hiddenLocations,
      getBucketCounts,

      get isDataFetched() {
        return store.isFetched;
      },
    };
  });

/**
 * Common interfaces used across stores and app
 */

export interface GageSummary {
  id: string;
  nwrfcId: string;
  title: string;
  warningDischarge: number;
  floodDischarge: number;
  isMetagage: boolean;
  color?: string;
}

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
