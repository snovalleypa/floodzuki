import dayjs from "dayjs"

const API = {
  SVPA_REGION_ID: 1,

  ABOUT_URL: "https://svpa.us/floodzilla-gage-network/",

  reading: {
    GET_STATUS_URL: "/api/GetGageStatusAndRecentReadings",
    GET_READINGS_URL: "/api/GetGageReadingsUTC",
    GET_FORECAST_URL: "/api/GetForecastsUTC",
    GET_READINGS_V2_URL: "/api/v2/GetRecentReadings",
    GET_FORECAST_V2_URL: "/api/v2/GetForecast",
  },

  client: {
    GET_GAGE_LIST_URL: "/api/client/APIGetLocationInfo",
    GET_METAGAGES_URL: "/api/v2/GetMetagages",
    GET_REGION_URL: "/api/v2/GetRegion",
  },

  subscriptions: {
    SETTINGS_URL: "/api/subscription/usersettings",
    SUBSCRIPTIONS_URL: "/api/subscription/usersubs",
    UNSUBEMAIL_URL: "/api/subscription/unsubemail",
  },

  auth: {
    AUTHENTICATE_URL: "/Account/Authenticate",
    CREATEACCOUNT_URL: "/Account/CreateAccount",
    REAUTHENTICATE_URL: "/Account/Reauthenticate",
    AUTHENTICATE_WITH_GOOGLE_URL: "/Account/AuthenticateWithGoogle",
    AUTHENTICATE_WITH_APPLE_URL: "/Account/AuthenticateWithApple",
    AUTHENTICATE_WITH_FACEBOOK_URL: "/Account/AuthenticateWithFacebook",
    UPDATEACCOUNT_URL: "/Account/UpdateAccount",
    FORGOTPASSWORD_URL: "/Account/APIForgotPassword",
    SETPASSWORD_URL: "/Account/APISetPassword",
    CREATEPASSWORD_URL: "/Account/APICreatePassword",
    RESETPASSWORD_URL: "/Account/APIResetPassword",
    SENDVERIFICATIONEMAIL_URL: "/Account/SendVerificationEmail",
    VERIFYEMAIL_URL: "/Account/VerifyEmail",
    SENDPHONEVERIFICATION_URL: "/Account/SendPhoneVerificationSms",
    VERIFYPHONE_URL: "/Account/VerifyPhone",
    DELETE_ACCOUNT_URL: "/Account/FullyDeleteUser",
  
    FACEBOOK_LOGIN_PROVIDER_NAME: "Facebook",
    GOOGLE_LOGIN_PROVIDER_NAME: "Google",

    SET_PUSH_TOKEN_URL: "/Account/SetDevicePushToken",
  
    ID_TOKEN_HEADER: "X-fz-idToken",
  }
}

const BaseConfig: {
  BASE_URL: string
  AUTH_BASE_URL: string
  RESOURCE_BASE_URL: string
  READING_BASE_URL: string
  GAGE_IMAGE_BASE_URL: string
  DONATION_URL: string

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

  PASSWORD_MIN_LENGTH: number

  API: typeof API

  FORECAST_GAGE_IDS: string[]
  GAGES_WITHOUT_DISHCARGE: string[]
} = {
  BASE_URL: "https://floodzilla.com",
  AUTH_BASE_URL: "https://floodzilla.com",
  RESOURCE_BASE_URL: "//floodzilla.com",
  READING_BASE_URL: "https://prodplanreadingsvc.azurewebsites.net",
  GAGE_IMAGE_BASE_URL: "https://svpastorage.blob.core.windows.net/uploads/",
  DONATION_URL: "https://www.paypal.com/donate/?hosted_button_id=HT6T3U5F2C4NG",

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

  PASSWORD_MIN_LENGTH: 8,

  API: API,

  FORECAST_GAGE_IDS: ['USGS-SF17/USGS-NF10/USGS-MF11', 'USGS-38', 'USGS-22'],
  GAGES_WITHOUT_DISHCARGE: ['USGS-9'],
}

export default BaseConfig
