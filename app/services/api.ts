/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import {
  ApiResponse,
  ApisauceInstance,
  create,
} from "apisauce"
import Config from "@config/config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"

interface ApiConfig {
  url: string // The URL of the api.
  timeout: number // Milliseconds before we timeout the request.
}

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.BASE_URL,
  timeout: 10000,
}

async function genericGetRequest<T>(
  api: ApisauceInstance,
  url: string,
  params?: {[key: string]: any},
): Promise<{ kind: 'ok', data: T } | GeneralApiProblem > {
  const response: ApiResponse<T> = await api.get(url, params)
  
  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  try {
    const rawData = response.data

    return { kind: 'ok', data: rawData }
  }
  catch (e) {
    if (__DEV__) {
      console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
    }
    return { kind: "bad-data" }
  }
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  async getRegion<T>() {
    this.apisauce.setBaseURL(Config.BASE_URL)
    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.client.GET_REGION_URL,
      {
        regionId: Config.SVPA_REGION_ID,
      }
    )
  }

  async getMetagages<T>() {
    this.apisauce.setBaseURL(Config.BASE_URL)
    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.client.GET_METAGAGES_URL,
      {
        regionId: Config.SVPA_REGION_ID,
      }
    )
  }

  async getLocationInfo<T>() {
    this.apisauce.setBaseURL(Config.BASE_URL)
    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.client.GET_GAGE_LIST_URL,
      {
        regionId: Config.SVPA_REGION_ID,
      }
    )
  }

  async getStatusAndRecentReadings<T>(
    fromDateTime: string,
    toDateTime: string,
  ) {
    this.apisauce.setBaseURL(Config.READING_BASE_URL)

    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.reading.GET_STATUS_URL, {
        regionId: Config.SVPA_REGION_ID,
        fromDateTime,
        toDateTime,
      }
    )
  }

  async getGageReadings<T>(
    gageId: string,
    fromDateTime?: string,
    toDateTime?: string,
    lastReadingId?: string,
    includeStatus?: boolean,
    includePredictions?: boolean,
  ) {
    this.apisauce.setBaseURL(Config.READING_BASE_URL)

    const params = {
      regionId: Config.SVPA_REGION_ID,
      gageId,
    }

    if (fromDateTime) {
      params["fromDateTime"] = fromDateTime
    }

    if (toDateTime) {
      params["toDateTime"] = toDateTime
    }

    if (lastReadingId) {
      params["lastReadingId"] = lastReadingId
      params["getMinimalReadings"] = true
    }

    if (includeStatus) {
      params["includeStatus"] = includeStatus
    }

    if (includePredictions) {
      params["includePredictions"] = includePredictions
    }

    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.reading.GET_READINGS_URL,
      params
    )
  }

  async getForecastsUTC<T>(
    gageIds: string,
    fromDateTime?: string,
    toDateTime?: string,
  ) {
    this.apisauce.setBaseURL(Config.READING_BASE_URL)

    const params = {
      regionId: Config.SVPA_REGION_ID,
      includePredictions: true,
      gageIds,
    }

    if (fromDateTime) {
      params["fromDateTime"] = fromDateTime
    }

    if (toDateTime) {
      params["toDateTime"] = toDateTime
    }

    return await genericGetRequest<T>(
      this.apisauce,
      Config.API.reading.GET_FORECAST_URL,
      params
    )
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
