import dayjs from "dayjs"

const API = {
  SVPA_REGION_ID: 1,

  ABOUT_URL: "https://svpa.us/floodzilla-gage-network/",

  reading: {
    GET_STATUS_URL: "/api/GetGageStatusAndRecentReadings",
    GET_READINGS_URL: "/api/GetGageReadingsUTC",
    GET_FORECAST_URL: "/api/GetForecastsUTC",
  },

  client: {
    GET_GAGE_LIST_URL: "/api/client/APIGetLocationInfo",
    GET_METAGAGES_URL: "/api/client/GetMetagages",
    GET_REGION_URL: "/api/v2/GetRegion",
  }
}

const BaseConfig: {
  BASE_URL: string
  RESOURCE_BASE_URL: string
  READING_BASE_URL: string
  GAGE_IMAGE_BASE_URL: string

  SVPA_URL: string
  SVPA_PHONE: string
  SVPA_EMAIL: string
  NOAA_URL: string
  
  GAGE_DATA_REFRESH_RATE: number
  GAGE_CLIENT_CACHE_TIME: number
  DASHBOARD_DATA_REFRESH_RATE: number
  LIVE_CHART_DATA_REFRESH_INTERVAL: number

  FRONT_PAGE_CHART_DURATION_NUMBER: number
  FRONT_PAGE_CHART_DURATION_UNIT: dayjs.ManipulateType

  API: typeof API

  FORECAST_GAGE_IDS: string[]
} = {
  BASE_URL: "https://floodzilla.com",
  RESOURCE_BASE_URL: "//floodzilla.com",
  READING_BASE_URL: "https://prodplanreadingsvc.azurewebsites.net",
  GAGE_IMAGE_BASE_URL: "https://svpastorage.blob.core.windows.net/uploads/",

  SVPA_URL: "https://svpa.us",
  SVPA_PHONE: "425-549-0316",
  SVPA_EMAIL: "info@svpa.us",
  NOAA_URL: "http://www.nwrfc.noaa.gov/",
  
  GAGE_DATA_REFRESH_RATE: 10000, // ms
  GAGE_CLIENT_CACHE_TIME: 9000, // ms
  DASHBOARD_DATA_REFRESH_RATE: 30 * 1000, // ms
  LIVE_CHART_DATA_REFRESH_INTERVAL: 60 * 1000, // ms

  FRONT_PAGE_CHART_DURATION_NUMBER: 2,
  FRONT_PAGE_CHART_DURATION_UNIT: 'day',

  API: API,

  FORECAST_GAGE_IDS: ['USGS-SF17/USGS-NF10/USGS-MF11', 'USGS-38', 'USGS-22'],
}

export default BaseConfig
