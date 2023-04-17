import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { api } from "@services/api"
import { flow } from "mobx-state-tree"
import dayjs from "dayjs"

import { GageReadingModel } from "./GageReading"
import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps"
import { withSetPropAction } from "./helpers/withSetPropsAction"
import Config from "@config/config"
import { LocationInfoModel } from "./LocationInfo"
import localDayJs from "@services/localDayJs"
import { DataPoint, ForecastStoreModel, NOAAForecastModel } from "./Forecasts"
import USGS_INFO from "@utils/usgsInfo"

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

export enum GageChartDataType {
  LEVEL = 'level',
  DISCHARGE = 'discharge',
  FORECAST = 'forecast',
};

export const STATUSES = {
  "Offline": "offline",
  "Online": "success",
  "Dry": "success",
  "Normal": "success",
  "NearFlooding": "warning",
  "Flooding": "danger",
}


const mapAndAdjustForecastTimestampsForDisplay = (forecastData) => {
  return forecastData.map(point => {
    return {
      reading: point.stage,
      waterDischarge: point.waterDischarge,
      timestamp: localDayJs.tz(point.timestamp),
      isDeleted: false
    } as DataPoint;
  });
}
  
const mapAndAdjustTimestampsForDisplay = (dataPoints) => {
    return dataPoints.map(point => {
      return {
        reading: point.waterHeight,
        waterDischarge: point.waterDischarge,
        timestamp: localDayJs.tz(point.timestamp),
        isDeleted: point.isDeleted
      } as DataPoint;
    });
  }

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

export const GageModel = types
  .model("Gage")
  .props({
    id: types.maybe(types.string),
    locationName: types.maybe(types.string),
    locationId: types.identifier,
    isOffline: types.maybe(types.boolean),
    rank: types.maybe(types.number),
    deviceTypeName: types.maybe(types.string),
    timeZoneName: types.maybe(types.string),
    lastReadingId: types.maybe(types.number),
    peakStatus: types.maybe(GageStatusModel),
    predictedCfsPerHour: types.maybe(types.number),
    predictedFeetPerHour: types.maybe(types.number),
    currentStatus: types.maybe(GageStatusModel),
    status: types.maybe(GageStatusModel),
    readings: types.array(GageReadingModel),
    actualReadings: types.array(GageReadingModel),
    noaaForecast: types.maybe(NOAAForecastModel),
    predictions: types.array(GageReadingModel),
    locationInfo: types.safeReference(LocationInfoModel),
  })
  .actions(withSetPropAction)
  .views(store => ({
    get isUSGS() {
      return store.locationId?.match("USGS")
    },

    get riverMile() {
      return store.locationId?.match(/[0-9]+/g)[0]
    },

    get gageStatus() {
      return store.status || GageStatusModel.create({
        floodLevel: "Offline",
        levelTrend: "Offline",
      })
    },

    get lastReading() {
      return store.status?.lastReading
    },

    get waterLevel() {
      return store.status?.lastReading?.waterHeight || 0
    },

    get groundHeight() {
      return store.status?.lastReading?.groundHeight || 0
    },

    get waterDischarge() {
      return store.status?.lastReading?.waterDischarge || 0
    },

    get roadSaddleHeight() {
      return store.locationInfo?.roadSaddleHeight
    },

    get roadDisplayName() {
      return store.locationInfo?.roadDisplayName
    },

    get hasData() {
      return !!store.readings.length
    },

    get yellowStage() {
      return store.locationInfo?.yellowStage
    },

    get redStage() {
      return store.locationInfo?.redStage
    },

    get latitude() {
      return store.locationInfo?.latitude
    },

    get longitude() {
      return store.locationInfo?.longitude
    },

    getChartMinAndMax(chartDataType: GageChartDataType) {
      let yMinimum = 0, yMaximum = 0;

      if (chartDataType === GageChartDataType.DISCHARGE) {
        yMinimum = store.locationInfo?.dischargeMin;
        yMaximum = store.locationInfo?.dischargeMax;
      } else {
        yMinimum = store.locationInfo?.yMin;
        yMaximum = store.locationInfo?.yMax;
      }

      return {
        yMinimum,
        yMaximum,
      }
    },
  }))
  .views(store => ({
    get roads() {
      return [{
        elevation: store.roadSaddleHeight,
        name: store.roadDisplayName
      }]
    },

    get hasRoads() {
      return !!store.roadSaddleHeight && !!store.roadDisplayName
    },

    get dataPoints() {
      if (!store.hasData) return [];

      return mapAndAdjustTimestampsForDisplay(store.readings);
    },

    get chartReadings() {
      if (!store.hasData) return [];

      return store.readings.filter(reading => !reading.isDeleted)
        .map(reading => ({
          date: new Date(reading.timestamp),
          value: reading.waterHeight,
        }));
    },

    get predictedPoints() {
      let points = [];

      const predictions = store?.predictions;

      if (predictions && predictions.length) {
        let predWithNoGap = [...predictions];
        predWithNoGap.unshift(store.readings[0]);
        
        points = mapAndAdjustTimestampsForDisplay(predWithNoGap);
      }
      
      return points;
    },

    get opearatorName() {
      return store.isUSGS ? "USGS" : "SVPA"
    },

    get usgsInfo() {
      return store.isUSGS ? USGS_INFO[store.locationId] : null
    },

    get actualPoints() {
      return mapAndAdjustTimestampsForDisplay(store.actualReadings || []);
    },

    get noaaForecastData() {
      return mapAndAdjustForecastTimestampsForDisplay(store.noaaForecast?.data || []);
    },

    get roadToYellowStage() {
      if (!store.yellowStage && !store.redStage) {
        return null;
      }

      if (
        store.yellowStage &&
        store.roadSaddleHeight &&
        store.yellowStage.toFixed(2) !== store.redStage.toFixed(2)
      ) {
        return store.roadSaddleHeight - store.yellowStage;
      }

      return null
    },

    get roadToRedStage() {
      if (!store.yellowStage && !store.redStage) {
        return null;
      }

      if (
        store.redStage &&
        store.roadSaddleHeight &&
        store.yellowStage.toFixed(2) !== store.redStage.toFixed(2)
      ) {
        return store.roadSaddleHeight - store.redStage;
      }

      return null
    },

    getCalculatedRoadStatus(waterLevel: number) {
      if (!store.roadSaddleHeight || !store.roadDisplayName) return null;
      
      const baseLevel = waterLevel || store.waterLevel;
      const level = baseLevel - store.roadSaddleHeight;
      const preposition = store.roadSaddleHeight - baseLevel > 0 ? "below" : "over";
      const deltaFormatted = Math.abs(level).toFixed(1) + " ft.";
      
      return {
        name: store.roadDisplayName,
        level,
        preposition,
        deltaFormatted
      };
    },

    clearLastReading() {
      store.lastReadingId = undefined;
    }
  }))


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

      if (response.kind === 'ok') {
        store.gages = response.data.gages?.map(gage => ({
          ...gage,
          lastReadingId: undefined,
          locationInfo: gage.locationId,
        })) || []
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    const fetchDataForGage = flow(function*(
      locationId: string,
      fromTime?: string,
      toTime?: string,
      includePredictions: boolean = true,
      includeLastReading: boolean = true,
    ) {
      store.setIsFetching(true)

      const toDateTime = toTime || localDayJs().utc().format()
      const fromDateTime = fromTime || localDayJs().subtract(
        Config.FRONT_PAGE_CHART_DURATION_NUMBER,
        Config.FRONT_PAGE_CHART_DURATION_UNIT
      ).utc().format()

      const gage = store.gages.find(gage => gage.locationId === locationId)

      const response = yield api.getGageReadings<Gage>(
        locationId,
        fromDateTime,
        toDateTime,
        includeLastReading && includePredictions ? gage.lastReadingId : undefined,
        true,
        includePredictions,
      )

      if (response.kind === 'ok') {
        const data = response.data
        
        if (data.noData) {
          store.setIsFetching(false)
          return
        }

        // We tend to ignore predictions only for historic events or events
        // that are in the past. In those cases, we don't want to update the lastReadingId
        if (includePredictions) {
          gage.setProp("lastReadingId", data.lastReadingId)
        }
        else {
          gage.setProp("lastReadingId", undefined)
        }
        
        // If last reading id is included - add it to the readings array
        if (includeLastReading) {
          gage.setProp("readings", [...gage.readings, ...data.readings])
        }
        else {
          // Otherwise, just replace the readings array
          gage.setProp("readings", data.readings)
        }
        
        gage.setProp("predictedCfsPerHour", data.predictedCfsPerHour)
        gage.setProp("predictedFeetPerHour", data.predictedFeetPerHour)
        gage.setProp("status", data.status)
        gage.setProp("peakStatus", data.peakStatus)
        gage.setProp("predictions", data.predictions || [])
      } else {
        store.setError(response.kind)
      }
      
      store.setIsFetching(false)
    })

    const getGageByLocationId = (id: string) => {
      return store.gages.find(gage => gage.locationId === id)
    }

    return {
      fetchData,
      fetchDataForGage,
      getGageByLocationId
    }
  })


export interface GageStore extends Instance<typeof GageStoreModel> {}
export interface GageStoreSnapshot extends SnapshotOut<typeof GageStoreModel> {}

export interface Gage extends Instance<typeof GageModel> {}
export interface GageSnapshotOut extends SnapshotOut<typeof GageModel> {}
export interface GageSnapshotIn extends SnapshotIn<typeof GageModel> {}
