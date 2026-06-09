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

    /**
     * Returns gages eligible for display / nav. When the toggle is off, stubs are
     * filtered out — they remain in the MST tree but are invisible. When on, both
     * real gages and stubs are returned.
     */
    const visibleGages = () => {
      const gages = store.gagesStore.gages;
      return store.showHiddenOffline ? gages : gages.filter((g) => !g._isStub);
    };

    const filterLocationsWithGages = () => {
      const gageIds = visibleGages().map((gage) => gage.locationId);
      return store.locationInfoStore.locationInfos.filter((location) =>
        gageIds.includes(location.id)
      );
    };

    const getLocationsWithGages = () => {
      const gages = visibleGages();
      const gageIds = gages.map((gage) => gage.locationId);

      return store.locationInfoStore.locationInfos
        .filter((location) => gageIds.includes(location.id))
        .map((location) => gages.find((gage) => gage.locationId === location.id));
    };

    const getLocationWithGagesIds = () => {
      const gages = visibleGages().map((gage) => gage.locationId);
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

    // A location is "hidden" for deep-link purposes only if (a) it is a stub-eligible
    // hidden location — i.e. a real, non-metagage location with no backing gage, which
    // `hiddenLocations()` already computes — and (b) it is not currently in the visible
    // list. Reusing hiddenLocations() (rather than scanning all locationInfos) excludes
    // the synthetic metagage, for which no stub is ever created; flipping the toggle on
    // for it would never reveal it. When the toggle is on, the stub is present and the id
    // appears in getLocationWithGagesIds(), so this correctly returns false.
    const isHiddenLocation = (locationId: string) =>
      !!locationId &&
      hiddenLocations().some((l) => l.id === locationId) &&
      !getLocationWithGagesIds().includes(locationId);

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
      isHiddenLocation,
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
