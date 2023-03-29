const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    back: "Back",
    title: "Floodzilla Gage Network",
  },
  measure: {
    cfs: "cfs",
  },
  errorScreen: {
    header: "Ooops...",
    title: "Something went wrong!",
    friendlySubtitle: "We're working on the problem.\nIn the meantime - feel free to try again.",
    reset: "Try again",
  },
  navigation: {
    homeScreen: "Home",
    forecastScreen: "Forecast",
    profileScreen: "Profile",
    back: "Go Back"
  },
  homeScreen: {
    title: "Snoqualmie River / SVPA",
  },
  forecastScreen: {
    title: "Forecast",
    details: "Details",
    latestReading: "Latest Reading",
    pastMax: "Past 24hr Max",
    forecastedCrests: "Forecasted Crests",
    lastReadings: "Last 100 Readings",
    currentlyForecasted: "Currently Forecasted",
    published: "published",
  },
  profileScreen: {
    title: "Profile",
  },
  forecastChart: {
    observed: "Observed",
    forecast: "Forecast",
    floodStage: "Flood Stage",
    discharge: "Discharge",
    now: "now",
    fullRangeTitle: "Full",
    rangeDays: "{{days}} days",
  }
}

export default en
export type Translations = typeof en
