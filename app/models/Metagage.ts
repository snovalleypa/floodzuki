import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { flow } from "mobx-state-tree"
import { api } from "@services/api"

import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import { GageSummary } from "./RootStore"
import { ChartColorsHex } from "@common-ui/constants/colors"

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
    ids: types.string,
    name: types.string,
    shortName: types.string,
    siteIds: types.maybe(types.string),
    siteId: types.maybe(types.string),
    stageOne: types.number, // flood warning
    stageTwo: types.number, // flooding level
  })
  .views(store => {
    const getForecastGage = () => {
      return {
        id: store.ids,
        nwrfcId: store.siteId,
        title: store.name,
        warningDischarge: store.stageOne,
        floodDischarge: store.stageTwo,
        isMetagage: true,
        color: ChartColorsHex[0],
      } as GageSummary
    }

    return {
      getForecastGage
    }
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

      if (response.kind === "ok") {
        console.log("Metagage response", response.data)
        store.metagages = (response.data || []).map(m => ({
          id: m.ids,
          ...m,
        }))
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