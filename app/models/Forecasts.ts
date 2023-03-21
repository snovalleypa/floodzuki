import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { api } from "@services/api"
import { flow } from "mobx-state-tree"
import dayjs from "dayjs"

import { GageReadingModel } from "./GageReading"
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import Config from "@config/config"

// "Forecast" Example data
// dischargeStageOne: 16500
// dischargeStageTwo: 19400
// lastReadingId: 2025024
// noData: false
// noaaForecast: {
//   county: "KING"
//   created: "2023-03-20T14:47:00"
//   currentDischarge: 2010
//   currentWaterHeight: 46.05
//   data: [
//     {
//       forecastId: 12045,
//       timestamp: "2023-03-20T17:00:00",
//       stage: 46.06,
//       discharge: 2078
//     }
//   ]
//   discharge: 2078
//   forecastId: 12045
//   stage: 46.06
//   timestamp: "2023-03-20T17:00:00"
//   description: "SNOQUALMIE - NEAR CARNATION"
//   elevation: 60
//   floodStage: 54
//   forecastId: 12045
//   latitude: 47.666111
//   longitude: 121.924167
//   noaaSiteId: "CRNW1"
//   peaks: [
//     {
//       forecastId: 12045,
//       timestamp: "2023-03-21T11:00:00",
//       stage: 46.6,
//       discharge: 3005    
//     }
//   ]
//   state: "WASHINGTON"
// }
// predictedCfsPerHour: 30
// predictedFeetPerHour: 0.01999999999999602
// predictions: [
//   {
//     timestamp: "2023-03-21T08:30:00",
//     waterHeight: 46.295,
//     waterDischarge: 2407.5,
//     isDeleted: false  
//   }
// ]
// readings: [
//   {
//     id: 2025024
//     isDeleted: false
//     isMissing: false
//     timestamp: "2023-03-21T08:15:00"
//     waterDischarge: 2400
//     waterHeight: 46.29
//   }
// ]

const ForecastPredictionModel = types
  .model("ForecastPrediction")
  .props({
    timestamp: types.maybe(types.string),
    waterHeight: types.maybe(types.number),
    waterDischarge: types.maybe(types.number),
    isDeleted: types.maybe(types.boolean),
  })

const NOAAForecastDataModel = types
  .model("NOAAForecastData")
  .props({
    forecastId: types.maybe(types.number),
    timestamp: types.maybe(types.string),
    stage: types.maybe(types.number),
    discharge: types.maybe(types.number),
  })

const NOAAPeakModel = types
  .model("NOAAPeak")
  .props({
    forecastId: types.maybe(types.number),
    timestamp: types.maybe(types.string),
    stage: types.maybe(types.number),
    discharge: types.maybe(types.number),
  })

const NOAAForecastModel = types
  .model("NOAAForecast")
  .props({
    county: types.maybe(types.string),
    created: types.maybe(types.string),
    currentDischarge: types.maybe(types.number),
    currentWaterHeight: types.maybe(types.number),
    data: types.array(NOAAForecastDataModel),
    discharge: types.maybe(types.number),
    forecastId: types.maybe(types.number),
    stage: types.maybe(types.number),
    timestamp: types.maybe(types.string),
    description: types.maybe(types.string),
    elevation: types.maybe(types.number),
    floodStage: types.maybe(types.number),
    latitude: types.maybe(types.number),
    longitude: types.maybe(types.number),
    noaaSiteId: types.maybe(types.string),
    peaks: types.array(NOAAPeakModel),
    state: types.maybe(types.string),
  })

const ForecastModel = types
  .model("Forecast")
  .props({
    dischargeStageOne: types.number,
    dischargeStageTwo: types.number,
    lastReadingId: types.number,
    noData: types.boolean,
    noaaForecast: NOAAForecastModel,
    predictedCfsPerHour: types.number,
    predictedFeetPerHour: types.number,
    predictions: types.array(ForecastPredictionModel),
    readings: types.array(GageReadingModel),
  })

export const ForecastStoreModel = types
  .model("ForecastStore")
  .props({
    forecasts: types.map(ForecastModel),
    ...dataFetchingProps
  })
  .actions(withDataFetchingActions)
  .actions(store => {
    const fetchData = flow(function*() {
      store.setIsFetching(true)
      
      const toDateTime = new Date().toUTCString()
      const fromDateTime = dayjs().subtract(
        Config.FRONT_PAGE_CHART_DURATION_NUMBER,
        Config.FRONT_PAGE_CHART_DURATION_UNIT
      ).toDate().toUTCString()

      const response = yield api.getForecastsUTC<{[gageId: string]: Forecast[]}>(
        Config.FORECAST_GAGE_IDS.join(','),
        fromDateTime,
        toDateTime,
      )

      __DEV__ && console.log("response", response)

      if (response.kind === 'ok') {
        store.forecasts = response.data
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    return {
      fetchData
    }
  })


export interface ForecastStore extends Instance<typeof ForecastStoreModel> {}
export interface ForecastStoreSnapshot extends SnapshotOut<typeof ForecastStoreModel> {}

export interface Forecast extends Instance<typeof ForecastModel> {}
export interface ForecastSnapshotOut extends SnapshotOut<typeof ForecastModel> {}
export interface ForecastSnapshotIn extends SnapshotIn<typeof ForecastModel> {}