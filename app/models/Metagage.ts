import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { flow } from "mobx-state-tree"
import { api } from "@services/api"

import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"

// "Metagage" Example data
// id: "USGS-SF17/USGS-NF10/USGS-MF11"
// name: "Sum of the 3 forks"
// shortName: "Forks"
// siteId: "GARW1-SNQW1-TANW1"
// stageOne: 10000
// stageTwo: 12000

const MetagageModel = types
.model("Metagage")
.props({
  id: types.string,
  name: types.string,
  shortName: types.string,
  siteIds: types.maybe(types.string),
  stageOne: types.number, // flood warning
  stageTwo: types.number, // flooding level
})

export const MetagageModelStore = types
  .model("MetagageStore")
  .props({
    metagages: types.array(MetagageModel),
    ...dataFetchingProps
  })
  .actions(withDataFetchingActions)
  .actions(store => {
    const fetchData = flow(function*() {
      store.setIsFetching(true)
      
      const response = yield api.getMetagages<Metagage[]>()

      __DEV__ && console.log("response", response)

      if (response.kind === "ok") {
        // Looks like output provides "data" as a string so we'll parse it here
        store.metagages = JSON.parse(response.data)
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    return {
      fetchData
    }
  })


export interface MetagageStore extends Instance<typeof MetagageModelStore> {}
export interface MetagageStoreSnapshot extends SnapshotOut<typeof MetagageModelStore> {}

export interface Metagage extends Instance<typeof MetagageModel> {}
export interface MetagageSnapshotOut extends SnapshotOut<typeof MetagageModel> {}
export interface MetagageSnapshotIn extends SnapshotIn<typeof MetagageModel> {}