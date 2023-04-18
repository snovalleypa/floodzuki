export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...config.ios.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    }
  },
  android: {
    ...config.android,
    config: {
      ...config.android.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  }
});
