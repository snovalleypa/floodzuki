import React from "react";

import Config from "@config/config";
import { DataPoint, Forecast } from "@models/Forecasts";
import { GageSummary } from "@models/RootStore";

import { api } from "@services/api";
import localDayJs from "@services/localDayJs";

/**
 * This is a potential workaround to handle the performance
 * issues with the ForecastScreen. 
 * 
 * TODO: Figure out if it's actually more performant
 */


type ForecastContextProps = {
  forecasts: {}
  fetchData: () => void
  getForecast: (gageId: string) => ForecastModel
  getForecastsList: () => ForecastModel[]
}

const emptyContext: ForecastContextProps = {
  forecasts: {},
  fetchData: () => {},
  getForecast: (gageId: string) => undefined,
  getForecastsList: () => []
}

class ForecastModel {
  _data: Forecast

  constructor(forecast: Forecast) {
    this._data = forecast
  }

  get data() {
    return this._data
  }

  get latestReading() {
    return this._data?.dataPoints[0]
  }

  get maxReading() {
    const dataPoints = this._data?.dataPoints

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
  }

  get dataPoints() {
    return this._data?.readings?.map(reading => {
      return {
        reading: reading.waterHeight,
        waterDischarge: reading.waterDischarge,
        timestamp: reading.timestamp,
      } as DataPoint
    })
  }

  get forecastDataPoints() {
    return this._data?.noaaForecast?.data?.map(forecast => {
      return {
        reading: forecast.stage,
        waterDischarge: forecast.discharge,
        timestamp: forecast.timestamp,
      } as DataPoint
    })
  }

  get last100Readings() {
    return this._data?.dataPoints.slice(0, 100)
  }

  get last100ForecastReadings() {
    return this._data?.forecastDataPoints.slice(0, 100)
  }

  get peaks() {
    const peaks = this._data?.noaaForecast?.peaks.map(peak => {
      return {
        ...peak,
        reading: peak.stage,
        waterDischarge: peak.discharge,
      }
    })

    return peaks
  }

  getForecastGage = () => {
    return {
      id: this._data?.id,
      nwrfcId: this._data?.noaaForecast?.noaaSiteId,
      title: this._data?.id,//this._data?.locationInfo?.shortName,
      warningDischarge: this._data?.dischargeStageOne,
      floodDischarge: this._data?.dischargeStageTwo,
      isMetagage: false,
    } as GageSummary
  }
}

const ForecastContext = React.createContext<ForecastContextProps>(emptyContext);

export const useForecastContext = () => React.useContext(ForecastContext);

export const ForecastProvider = ({ children }: any) => {
  const [forecasts, setForecasts] = React.useState<Object>({})
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>('')

  const fetchData = async () => {
    setLoading(true)

    const toDateTime = new Date().toUTCString()
    const fromDateTime = localDayJs().subtract(
      Config.FRONT_PAGE_CHART_DURATION_NUMBER,
      Config.FRONT_PAGE_CHART_DURATION_UNIT
    ).toDate().toUTCString()

    const response = await api.getForecastsUTC<{[gageId: string]: Object}>(
      Config.FORECAST_GAGE_IDS.join(','),
      fromDateTime,
      toDateTime,
    )

    if (response.kind === 'ok') {
      const forecasts = {}

      // Augment data with id
      Object.keys(response.data).forEach(gageId => {
        const value = response.data[gageId]
        
        const extendedValue = {
          id: gageId,
          locationInfo: gageId,
          ...value,
        }
        
        forecasts[gageId] = new ForecastModel(extendedValue)
      })

      setForecasts(forecasts)
    } else {
      setError(response.kind)
    }
    
    setLoading(false)
  }

  const getForecast = (gageId: string) => {
    return forecasts[gageId]
  }

  const getForecastsList = () => {
    return Object.keys(forecasts).map(gageId => {
      return forecasts[gageId]
    })
  }

  const context = {
    forecasts,
    fetchData,
    getForecast,
    getForecastsList
  }

  return (
    <ForecastContext.Provider value={context}>
      {children}
    </ForecastContext.Provider>
  )
}