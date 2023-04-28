const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    save: "Save",
    back: "Back",
    title: "Floodzilla Gage Network",
    subtitle: "An SVPA Project",
    loading: "Loading...",
    tel: "tel:",
    email: "email:",
  },
  measure: {
    cfs: "cfs",
    ft: "ft",
    hr: "hr",
    feet: "feet",
    hour: "hour",
    max: "Max",
  },
  status: {
    normal: "Normal",
    nearFlooding: "Near Flooding",
    flooding: "Flooding",
  },
  statuses: {
    Offline: "Offline",
    Online: "Online",
    Normal: "Normal",
    NearFlooding: "Near Flooding",
    Flooding: "Flooding",
    Dry: "Dry",
  },
  errorScreen: {
    header: "Ooops...",
    title: "Something went wrong!",
    friendlySubtitle: "We're working on the problem.\nIn the meantime - feel free to try again.",
    reset: "Try again",
  },
  navigation: {
    homeScreen: "Active",
    forecastScreen: "Forecast",
    alertsScreen: "Alerts",
    profileScreen: "Edit Profile",
    loginScreen: "Login",
    aboutScreen: "About",
    newAccountScreen: "Create Account",
    passwordForgotScreen: "Forgot Password",
    passwordResetScreen: "Reset Password",
    passwordSetScreen: "Change Password",
    passwordCreateScreen: "Choose Password",
    verifyPhoneNnumberScreen: "Verify Phone Number",
    changePhoneNnumberScreen: "Change Phone Number",
    changeemailScreen: "Change Email Address",
    verifyemailScreen: "Verify Email Address",
    unsubscribeScreen: "Unsubscribe",
    privacyPolicyScreen: "Privacy Policy",
    termsOfServiceScreen: "Terms of Service",
    logout: "Logout",
    back: "Go Back"
  },
  homeScreen: {
    title: "Snoqualmie River / SVPA",
  },
  forecastScreen: {
    title: "Forecast",
    details: "Details",
    viewGage: "View Gage",
    latestReading: "Latest Reading",
    pastMax: "Past 24hr Max",
    forecastedCrests: "Forecasted Crests",
    lastReadings: "Last 100 Readings",
    currentlyForecasted: "Currently Forecasted",
    published: "published",
    noaaGage: "NOAA Gage",
    dataSuppliedBy: "Flood gage data supplied by the",
    noaaTitle: "National Weather Service Northwest River Forecast Center",
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
    rangeDay: "day",
  },
  gageChart: {
    discharge: "Discharge",
    waterLevel: "Water Level",
    Now: "Now",
    dashboardDurationLabel: "48 hrs. ago",
  },
  gageScreen: {
    goToUpstreamGage: "Go to Upstream Gage",
    goToDownstreamGage: "Go to Downstream Gage",
  },
  calloutReading: {
    lastReading: "Last Reading",
    peak: "Peak",
    waterLevel: "Water Level",
    waterFlow: "Water Flow",
    status: "Status",
    trend: "Trend",
    road: "Road",
    roadSmall: " road",
  },
  gageDetailsChart: {
    discharge: "Discharge",
    waterLevel: "Water Level",
    _selectEvent: "- select event -",
    selectEvent: "Select Event",
    historicalEvents: "Historical Events",
    rateOfChange: "Rate of Change",
    roadLevel: "Road Level",
  },
  gageInfoCard: {
    gageInfo: "Gage Info",
    gageID: "Gage ID",
    operatedBy: "Operated By",
    riverMile: "River Mile",
    usgsWebsite: "USGS Website",
    gage: "Gage",
    latitude: "Latitude",
    longitude: "Longitude",
  },
  statusLevelsCard: {
    roadSaddle: "road saddle",
    level: "level",
    below: "below",
    above: "above",
    logInToGetAlerts: "Log in to get Alerts when status changes",
    getAlerts: "Get Alerts when status changes",
    manageAlerts: "Manage Alerts",
    statusLevels: "Status Levels",
    Below: "Below",
    atAndAbove: "At and above",
  },
  footer: {
    svpaTitle: "The Snoqualmie Valley Preservation Alliance",
    description1: "The Floodzilla Gage Network is maintained by ",
    description2: ". The Snoqualmie Valley Preservation Alliance is a 501(c)(3) nonprofit organization committed to protecting the viability of farms, residents, and businesses of the beautiful Snoqualmie River Valley. This site is made possible by the countless volunteer hours of the local technology team, SVPA donors, and a generous grant from King County Flood Control District.",
    addressLine1: "Physical Address",
    addressLine2: "U.S. Mail",
    copyright: "© Snoqualmie Valley Preservation Alliance"
  },
  about: {

  }
}

export default en
export type Translations = typeof en
