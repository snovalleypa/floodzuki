import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { flow } from "mobx-state-tree"
import { api } from "@services/api"

import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import { withSetPropAction } from "./helpers/withSetPropsAction"

// "Region" Example data
// "id": 1,
// "name": "Snoqualmie Valley",
// "timezone": "America/Los_Angeles",
// "baseUrl": "https://floodzilla.com",
// "defaultForecastGageList": [
//   "USGS-SF17/USGS-NF10/USGS-MF11",
//   "USGS-38",
//   "USGS-22"
// ]

const RegionModel = types
  .model("Region")
  .props({
    id: types.maybe(types.number),
    name: types.maybe(types.string),
    timezone: types.maybe(types.string),
    baseUrl: types.maybe(types.string),
    defaultForecastGageList: types.array(types.string),
  })

export const RegionModelStore = types
  .model("RegionStore")
  .props({
    region: types.maybe(RegionModel),
    ...dataFetchingProps
  })
  .actions(withDataFetchingActions)
  .actions(withSetPropAction)
  .actions(store => {
    const fetchData = flow(function*() {
      store.setIsFetching(true)
      
      const response = yield api.getRegion<Region>()

      __DEV__ && console.log("response", response)

      if (response.kind === "ok") {
        // Looks like output provides "data" as a string so we'll parse it here
        store.region = JSON.parse(response.data)
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    return {
      fetchData
    }
  })


export interface RegionStore extends Instance<typeof RegionModelStore> {}
export interface RegionStoreSnapshot extends SnapshotOut<typeof RegionModelStore> {}

export interface Region extends Instance<typeof RegionModel> {}
export interface RegionSnapshotOut extends SnapshotOut<typeof RegionModel> {}
export interface RegionSnapshotIn extends SnapshotIn<typeof RegionModel> {}
