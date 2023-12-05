import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { api } from "@services/api"
import { flow } from "mobx-state-tree"

import { withDataFetchingActions, dataFetchingProps } from "./helpers/withDataFetchingProps"
import { withSetPropAction } from "./helpers/withSetPropsAction"
import { GageModel } from "./Gage"

// "LocationInfo" Example data
// id: "USGS-SF17"
// deviceTypeName: "USGS"
// dischargeMax: 5000
// dischargeMin: 100
// floodEvents: [
//   {
//     id: 35,
//     eventName: "2022 - November ",
//     fromDate: "2022-11-04T00:00:00",
//     toDate: "2022-11-08T00:00:00"
//   }
// ]
// groundHeight: 0
// hasDischarge: true
// isCurrentlyOffline: false
// isOffline: false
// latitude: 47.4151086
// locationName: "South Fork Snoqualmie River"
// longitude: -121.5873213
// noaaSiteId: "GARW1"
// rank: 5
// redStage: 13.5
// shortName: "South Fork"
// timeZoneName: "America/Los_Angeles"
// usgsSiteId: 12143400
// yMax: 18
// yMin: 9
// yellowStage: 12.5

// "Metagage" Example data
// id: "USGS-SF17/USGS-NF10/USGS-MF11"
// name: "Sum of the 3 forks"
// shortName: "Forks"
// siteId: "GARW1-SNQW1-TANW1"
// stageOne: 10000
// stageTwo: 12000

const FloodEventModel = types
  .model("FloodEvent")
  .props({
    id: types.number,
    eventName: types.string,
    fromDate: types.string,
    toDate: types.string,
  })

export const LocationInfoModel = types
  .model("LocationInfo")
  .props({
    id: types.identifier,
    ids: types.optional(types.string, ""), // Metagage Prop
    isMetagage: types.optional(types.boolean, false), // Metagage Prop
    deviceTypeName: types.optional(types.string, ""), // Gage prop
    shortName: types.optional(types.string, ""), // Metagage prop
    name: types.optional(types.string, ""), // Metagage prop
    dischargeMax: types.optional(types.number, 0),
    dischargeMin: types.optional(types.number, 0),
    dischargeStageOne: types.optional(types.number, 0), // Gage prop
    dischargeStageTwo: types.optional(types.number, 0), // Gage prop
    floodEvents: types.optional(types.array(FloodEventModel), []),
    groundHeight: types.maybe(types.number),
    siteIds: types.maybe(types.string),
    siteId: types.maybe(types.string),
    hasDischarge: types.optional(types.boolean, false),
    isCurrentlyOffline: types.optional(types.boolean, false),
    isOffline: types.optional(types.boolean, false),
    latitude: types.maybe(types.number),
    locationName: types.optional(types.string, ""),
    locationImages: types.array(types.string),
    longitude: types.maybe(types.number),
    maxChangeThreshold: types.maybe(types.number),
    noaaSiteId: types.maybe(types.string),
    rank: types.optional(types.number, 0),
    redStage: types.maybe(types.number),
    roadDisplayName: types.maybe(types.string),
    roadSaddleHeight: types.maybe(types.number),
    timeZoneName: types.optional(types.string, ""),
    usgsSiteId: types.maybe(types.number),
    yMax: types.maybe(types.number),
    yMin: types.maybe(types.number),
    yellowStage: types.maybe(types.number),
  })
  

export const LocationInfoModelStore = types
  .model("LocationInfoStore")
  .props({
    locationInfos: types.array(LocationInfoModel),
    ...dataFetchingProps
  })
  .actions(withDataFetchingActions)
  .actions(withSetPropAction)
  .actions(store => {
    const fetchLocations = flow(function*() {
      store.setIsFetching(true)
      
      const response = yield api.getLocationInfo<LocationInfo[]>()

      if (response.kind === 'ok') {
        store.locationInfos = response.data.filter(l => !!l.id)
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    const fetchMetagages = flow(function*() {
      store.setIsFetching(true)
      
      const response = yield api.getMetagages<LocationInfo[]>()

      if (response.kind === "ok") {
        const metagages = (response.data || []).map(m => ({
          id: m.ids,
          dischargeStageTwo: m.stageTwo,
          dischargeStageOne: m.stageOne,
          ...m,
          isMetagage: true,
        }))

        store.locationInfos.push(...metagages)
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    const fetchData = flow(function*() {
      yield fetchLocations()
      yield fetchMetagages()
    })

    return {
      fetchData
    }
  })

export interface LocationInfoStore extends Instance<typeof LocationInfoModelStore> {}
export interface LocationInfo extends Instance<typeof LocationInfoModel> {}
export interface FloodEvent extends Instance<typeof FloodEventModel> {}

export interface LocationInfoSnapshotIn extends SnapshotIn<typeof LocationInfoModel> {}
export interface LocationInfoSnapshotOut extends SnapshotOut<typeof LocationInfoModel> {}
