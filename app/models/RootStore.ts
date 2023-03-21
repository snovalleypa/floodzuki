import { Instance, SnapshotOut, types } from "mobx-state-tree"
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
    gagesStore: types.optional(GageStoreModel, {}),
    gageReadingsStore: types.optional(GageReadingStoreModel, {}),
    regionStore: types.optional(RegionModelStore, {}),
    metagageStore: types.optional(MetagageModelStore, {}),
    locationInfoStore: types.optional(LocationInfoModelStore, {}),
    forecastsStore: types.optional(ForecastStoreModel, {}),
  })

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
