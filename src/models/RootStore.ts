import { flow, Instance, SnapshotOut, types } from "mobx-state-tree";
import { ForecastStoreModel } from "./Forecasts";
import { GageStoreModel } from "./Gage";
import { GageReadingStoreModel } from "./GageReading";
import { LocationInfoModelStore } from "./LocationInfo";
import { RegionModelStore } from "./Region";
import { AuthSessionStoreModel } from "./AuthSession";
import { computeBucketCounts } from "./helpers/regionSummary";
import { api } from "@services/api";
import Config from "@config/config";
import * as mockReplayEngine from "@services/mockReplay/engine";
import { getActiveScenario } from "@services/mockReplay/mockReplayState";
import { RawReading } from "@services/mockReplay/types";
import localDayJs from "@services/localDayJs";

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

      // When a replay scenario is active, preload historical data and capture the
      // session anchor BEFORE the forecast fetch so the engine can serve it. The
      // engine sets isPreloading() during init, so these fetches hit the real
      // network (mockActive() is false). Both fetch callbacks below are plain
      // async fns using await — the single generator yield is mockReplayEngine.init.
      const scenario = getActiveScenario();
      if (scenario) {
        // Inline the region tz (getTimezone view isn't in scope inside this action).
        const tz = store.regionStore?.region?.timezone || "America/Los_Angeles";
        const locations = store.locationInfoStore.locationInfos;
        const locationIds = locations.map((l) => l.id);
        const stagesByLocation: Record<string, { yellowStage?: number; redStage?: number }> = {};
        locations.forEach((l) => {
          stagesByLocation[l.id] = { yellowStage: l.yellowStage, redStage: l.redStage };
        });

        const fetchRawReadings = async (
          id: string,
          fromMs: number,
          toMs: number
        ): Promise<RawReading[]> => {
          const from = localDayJs(fromMs).utc().format();
          const to = localDayJs(toMs).utc().format();
          const res = await api.getGageReadings<{ readings?: any[]; noData?: boolean }>(
            id,
            from,
            to,
            undefined,
            true,
            false // includePredictions=false → real passthrough (also guarded by isPreloading)
          );
          if (res.kind !== "ok" || res.data?.noData || !res.data?.readings) {
            return [];
          }
          return res.data.readings.map((r) => ({
            timestampMs: localDayJs.tz(r.timestamp, "YYYY-MM-DDTHH:mm:ss", tz).valueOf(),
            waterHeight: r.waterHeight,
            waterDischarge: r.waterDischarge,
            isDeleted: r.isDeleted,
          }));
        };

        const fetchDashboardSkeletons = async (): Promise<any[]> => {
          const res = await api.getStatusAndRecentReadings<{ gages: any[] }>(
            localDayJs().subtract(2, "day").utc().format(),
            localDayJs().utc().format()
          );
          return res.kind === "ok" ? res.data?.gages ?? [] : [];
        };

        yield mockReplayEngine.init({
          scenario,
          timezone: tz,
          locationIds,
          forecastGageIds: Config.FORECAST_GAGE_IDS,
          stagesByLocation,
          fetchRawReadings,
          fetchDashboardSkeletons,
        });
      }

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

    /**
     * Like getLocationsWithGages but ignores the hidden/offline visibility toggle —
     * returns a gage (real, offline, or stub) for every location in river order.
     * Used by the forecast flood-probability cards, which should rank every covered
     * gauge regardless of whether it's currently shown on the gauge list. Relies on
     * hidden-location stubs having been materialized (see GageStore.syncHiddenStubs).
     */
    const getAllLocationsWithGages = () => {
      const gages = store.gagesStore.gages;
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
      getAllLocationsWithGages,
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
