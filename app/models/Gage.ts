import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { api } from "@services/api"
import { flow } from "mobx-state-tree"
import dayjs from "dayjs"

import { GageReadingModel } from "./GageReading"
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import { withSetPropAction } from "./helpers/withSetPropsAction"
import Config from "@config/config"

// Gage data from https://waterservices.usgs.gov/rest/IV-Service.html
// id: "USGS-38",
// locationName: "Snoqualmie River - Below the Falls",
// latitude: 47.5451019,
// longitude: -121.842336,
// isOffline: false,
// rank: 22,
// yMin: 0,
// yMax: 18,
// groundHeight: 0,
// deviceTypeName: "USGS",
// timeZoneName: "America/Los_Angeles",
// currentStatus: {
//   lastReading: {
//     timestamp: "2020-02-09T15:40:00",
//     waterHeight: 9.16,
//     groundHeight: 0,
//     waterDischarge: 8050,
//     isDeleted: false,
//   },
//   floodLevel: "Normal",
//   levelTrend: "Steady",
//   waterTrend: {
//     trendValues: [
//       0.23999999999999488,
//       -0.05999999999999872,
//       0,
//       -0.02999999999999936,
//     ],
//     trendValue: -0.02999999999999936,
//   },
// },

const WaterTrendModel = types
  .model("WaterTrend")
  .props({
    trendValues: types.array(types.number),
    trendValue: types.number,
  })

const GageStatusModel = types
  .model("GageStatus")
  .props({
    lastReading: types.maybe(GageReadingModel),
    floodLevel: types.maybe(types.string),
    levelTrend: types.maybe(types.string),
    waterTrend: types.maybe(WaterTrendModel),
  })

const GageModel = types
  .model("Gage")
  .props({
    id: types.maybe(types.string),
    locationName: types.maybe(types.string),
    locationId: types.maybe(types.string),
    latitude: types.maybe(types.number),
    longitude: types.maybe(types.number),
    isOffline: types.maybe(types.boolean),
    rank: types.maybe(types.number),
    yMin: types.maybe(types.number),
    yMax: types.maybe(types.number),
    groundHeight: types.maybe(types.number),
    deviceTypeName: types.maybe(types.string),
    timeZoneName: types.maybe(types.string),
    currentStatus: types.maybe(GageStatusModel),
    status: types.maybe(GageStatusModel),
    readings: types.array(GageReadingModel),
  })


export const GageStoreModel = types
  .model("GageStore")
  .props({
    gages: types.array(GageModel),
    ...dataFetchingProps
  })
  .actions(withDataFetchingActions)
  .actions(withSetPropAction)
  .actions(store => {
    const fetchData = flow(function*() {
      store.setIsFetching(true)
      
      const toDateTime = new Date().toUTCString()
      const fromDateTime = dayjs().subtract(
        Config.FRONT_PAGE_CHART_DURATION_NUMBER,
        Config.FRONT_PAGE_CHART_DURATION_UNIT
      ).toDate().toUTCString()

      const response = yield api.getStatusAndRecentReadings<{gages: Gage[]}>(
        fromDateTime,
        toDateTime,
      )

      __DEV__ && console.log("response", response)

      if (response.kind === 'ok') {
        store.gages = response.data.gages
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    return {
      fetchData
    }
  })


export interface GageStore extends Instance<typeof GageStoreModel> {}
export interface GageStoreSnapshot extends SnapshotOut<typeof GageStoreModel> {}

export interface Gage extends Instance<typeof GageModel> {}
export interface GageSnapshotOut extends SnapshotOut<typeof GageModel> {}
export interface GageSnapshotIn extends SnapshotIn<typeof GageModel> {}
