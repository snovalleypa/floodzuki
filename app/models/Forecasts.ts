import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { api } from "@services/api"
import { flow } from "mobx-state-tree"
import dayjs from "dayjs"

import { GageReadingModel } from "./GageReading"
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import Config from "@config/config"
import { LocationInfoModel } from "./LocationInfo"
import { GageSummary } from "./RootStore"
import localDayJs from "@services/localDayJs"

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

const DataPointModel = types
  .model("DataPoint")
  .props({
    reading: types.maybe(types.number),
    waterDischarge: types.maybe(types.number),
    timestamp: types.maybe(types.frozen()), // dayjs instance
    isDeleted: types.maybe(types.boolean),
  })

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
  .views(store => ({
    get reading() {
      return store.stage
    },

    get waterDischarge() {
      return store.discharge
    }
  }))

export const NOAAForecastModel = types
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
    id: types.string,
    dischargeStageOne: types.number,
    dischargeStageTwo: types.number,
    lastReadingId: types.number,
    noData: types.boolean,
    noaaForecast: NOAAForecastModel,
    predictedCfsPerHour: types.number,
    predictedFeetPerHour: types.number,
    predictions: types.array(ForecastPredictionModel),
    readings: types.array(GageReadingModel),
    locationInfo: types.maybe(types.reference(types.late(() => LocationInfoModel))),
  })
  .views(store => ({
    get dataPoints() {
      return store.readings?.map(reading => {
        return {
          reading: reading.waterHeight,
          waterDischarge: reading.waterDischarge,
          timestamp: localDayJs(reading.timestamp),
        } as DataPoint
      })
    },

    get forecastDataPoints() {
      return store.noaaForecast?.data?.map(forecast => {
        return {
          reading: forecast.stage,
          waterDischarge: forecast.discharge,
          timestamp: forecast.timestamp,
        } as DataPoint
      })
    },
  }))
  .views(store => {
    const getForecastGage = () => {
      return {
        id: store.id,
        nwrfcId: store?.noaaForecast?.noaaSiteId,
        title: store?.locationInfo?.shortName,
        warningDischarge: store.dischargeStageOne,
        floodDischarge: store.dischargeStageTwo,
        isMetagage: false,
      } as GageSummary
    }

    return {
      get latestReading() {
        return store?.dataPoints[0]
      },

      get maxReading() {
        const dataPoints = store?.dataPoints

        if (!dataPoints) return null

        const cutoff = localDayJs.tz(new Date()).subtract(24, 'hours').valueOf()
        let maxReading = dataPoints[0]
        let max = maxReading?.waterDischarge

        for (let i = 1; i < dataPoints.length; i++) {
          const reading = dataPoints[i]
          
          if (localDayJs.tz(reading.timestamp).valueOf() < cutoff) break
          
          if (reading.waterDischarge > max) {
            maxReading = reading
            max = reading.waterDischarge
          }
        }

        return maxReading
      },

      get last100Readings() {
        return store?.dataPoints.slice(0, 100)
      },

      get last100ForecastReadings() {
        return store?.forecastDataPoints.slice(0, 100)
      },

      getForecastGage,
    }
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

      const response = yield api.getForecastsUTC<{[gageId: string]: Forecast}>(
        Config.FORECAST_GAGE_IDS.join(','),
        fromDateTime,
        toDateTime,
      )

      if (response.kind === 'ok') {
        // Augment data with id
        Object.keys(response.data).forEach(gageId => {
          const value = response.data[gageId]
          
          const extendedValue = {
            id: gageId,
            locationInfo: gageId,
            ...value,
          }
          
          store.forecasts.set(gageId, extendedValue)
        })

      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    return {
      fetchData
    }
  })
  .views(store => ({
    getForecast(gageId: string) {
      return store.forecasts.get(gageId)
    }
  }))


export interface ForecastStore extends Instance<typeof ForecastStoreModel> {}
export interface ForecastStoreSnapshot extends SnapshotOut<typeof ForecastStoreModel> {}

export interface Forecast extends Instance<typeof ForecastModel> {}
export interface NOAAForecast extends Instance<typeof NOAAForecastModel> {}
export interface DataPoint extends Instance<typeof DataPointModel> {}
export interface ForecastSnapshotOut extends SnapshotOut<typeof ForecastModel> {}
export interface ForecastSnapshotIn extends SnapshotIn<typeof ForecastModel> {}
