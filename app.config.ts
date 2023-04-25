/** @type {import('expo/config').ExpoConfig} */

export default {
  name: "Floodzilla",
  slug: "floodzuki",
  scheme: "floodzuki",
  jsEngine: "hermes",
  icon: "./assets/app-icon/ios-universal.png",
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
    title: "Floodzilla Gage Network - SVPA",
    description: "A network of river gages on the Snoqualmie River deployed and managed by The Snoqualmie Valley Preservation Alliance",
    splash: {
      image: "./assets/splash-screen/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    }
  },
  ios: {
    bundleIdentifier: "com.floodzukiapp",
    supportsTablet: true,
    associatedDomains: [
      "applinks:floodzilla.com"
    ],
    icon: "./assets/app-icon/ios-universal.png",
    splash: {
      image: "./assets/app-icon/android-adaptive-foreground.png",
      tabletImage: "./assets/app-icon/android-adaptive-foreground.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    }
  },
  android: {
    package: "com.floodzukiapp",
    intentFilters: [
      {
        action: "VIEW",
        data: {
          scheme: "https",
          host: "floodzilla.com"
        },
        category: [
          "BROWSABLE",
          "DEFAULT"
        ]
      }
    ],
    icon: "./assets/app-icon/android-legacy.png",
    adaptiveIcon: {
      foregroundImage: "./assets/app-icon/android-adaptive-foreground.png",
      backgroundImage: "./assets/app-icon/android-adaptive-background.png"
    },
    splash: {
      image: "./assets/app-icon/ios-universal.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  },
  build: {
    preview: {
      channel: "preview"
    },
    production: {
      channel: "production"
    }
  },
  updates: {
    url: "https://u.expo.dev/0f52b777-109a-423d-a18b-1ccfb5dea8e0"
  },
  runtimeVersion: {
    policy: "sdkVersion"
  },
  plugins: [
    "expo-localization"
  ],
  extra: {
    router: {
      origin: "https://floodzilla.com",
    },
    eas: {
      projectId: "0f52b777-109a-423d-a18b-1ccfb5dea8e0"
    },
    recaptchaKey: process.env.GOOGLE_RECAPTCH_SITE_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
  owner: "floodzilla-svpas"
};
