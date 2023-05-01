/** @type {import('expo/config').ExpoConfig} */

const isDevelopment = process.env.APP_ENV === "dev";

export default {
  name: "Floodzilla",
  slug: "floodzuki",
  scheme: "floodzuki",
  jsEngine: "hermes",
  runtimeVersion: "1.0.0",
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
    bundleIdentifier: "com.floodzilla.floodzuki",
    supportsTablet: true,
    associatedDomains: [
      "applinks:floodzuki.ngrok.io",
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
    package: "com.floodzilla.floodzuki",
    googleServicesFile: isDevelopment ? "./google-services.json" : process.env.GOOGLE_SERVICES_JSON,
    intentFilters: [
      {
        action: "VIEW",
        data: {
          scheme: "https",
          host: "floodzuki.ngrok.io"
        },
        category: [
          "BROWSABLE",
          "DEFAULT"
        ]
      },
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
  updates: {
    url: "https://u.expo.dev/0f52b777-109a-423d-a18b-1ccfb5dea8e0"
  },
  plugins: [
    "expo-localization",
    [
      "expo-updates", {
        "username": "floodzilla-svpa",
      }
    ]
  ],
  extra: {
    router: {
      origin: "https://floodzuki.ngrok.io",
    },
    eas: {
      projectId: "0f52b777-109a-423d-a18b-1ccfb5dea8e0"
    },
    recaptchaKey: process.env.GOOGLE_RECAPTCH_SITE_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    googleOAuthWebClientId: process.env.GOOGLE_AUTH_WEB_ID,
    googleOAuthAndroidClientId: process.env.GOOGLE_AUTH_ANDROID_ID,
    googleOAuthIOSClientId: process.env.GOOGLE_AUTH_IOS_ID,
    googleOAuthExpoClientId: process.env.GOOGLE_AUTH_EXPO_ID,
    googleOauthClientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
  },
  owner: "floodzilla-svpa"
};
