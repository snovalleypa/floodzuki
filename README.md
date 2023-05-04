# Floodzuki
## Take control on your floods

New Client for Floodzilla Gage Monitoring System.
This client supports Web, iOS and Android platforms and allows you to view Gage status, check the flooding predictions and subscribe for alerts if things will go south.

## How to run the app

This is an expo app, so you can run it on your phone or in the browser.

#### Install Expo app

First you'll need to install an [ExpoGo](https://expo.dev/client) app on your phone. It is also possible to grab development and simulator builds from the [Expo website](https://expo.dev/accounts/floodzilla-svpa/projects/floodzuki/builds).

#### Install Expo CLI

You might also need to install the [Expo CLI](https://docs.expo.dev/workflow/expo-cli/) on your computer.

```bash
npm install -g expo-cli
```

#### Install dependencies

```bash
npm install
```

#### Run the app

```bash
npm start
```

This will start the app server. You can scan the QR code with your phone to run the app on your phone.

Enjoy! 🥳


## 🏗️ Things to keep in Mind

### Supported Platforms
The app supports Web, iOS and Android platforms. It is built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/).

### Navigation
The app uses [Expo Router](https://expo.github.io/router/docs) for navigation. This is a file based router, meaning that every file placed under `app/` directory will be treated as a separate screen. You can read more about it in the [Expo Router docs](https://expo.github.io/router/docs).

The entry point of the app is defined in `app/_layout.js` file. You can add new screens to the navigation by adding them under `app/(root)/` directory or any subderictories as well.

### Running Dev Builds
To fully utilize all supported features in development mode you'll need to run the app with some environment variables passed. You can do that by creating a `.env` file in the root of the project and adding the following variables to it:

```bash
  APP_ENV="dev"
  GOOGLE_AUTH_CLIENT_SECRET=""
  GOOGLE_RECAPTCH_SITE_KEY=""
  GOOGLE_MAPS_API_KEY=""
  GOOGLE_AUTH_EXPO_ID=""
  GOOGLE_AUTH_WEB_ID=""
  GOOGLE_AUTH_IOS_ID=""
  GOOGLE_AUTH_ANDROID_ID=""
```

or just run the app with the following command:

```bash
$ APP_ENV="dev" GOOGLE_AUTH_CLIENT_SECRET="" GOOGLE_RECAPTCH_SITE_KEY="" GOOGLE_MAPS_API_KEY="" GOOGLE_AUTH_EXPO_ID="" GOOGLE_AUTH_WEB_ID="" GOOGLE_AUTH_IOS_ID="" GOOGLE_AUTH_ANDROID_ID="" npx expo start
```

#### Push Notifications
To support push notifications on Android device in the standalone dev build you'll need to place `google-services.json` file in the root folder. You can get this file from the [Firebase console](https://console.firebase.google.com/).

Push Notifications will only work on actual devices. You can't test them in the simulator.


#### Maps
At the moment Maps are only available when running the app in Expo Go or in the browser. They are not supported in standalone dev builds.

#### Google Auth
Google Auth is only supported in the broser and standalone builds. It is not supported in the Expo Go app. To test it in the browser you'll need to start the secure tunnel with `$ EXPO_TUNNEL_SUBDOMAIN="floodzuki" npx expo start --tunnel --web` and open the app in the browser via `https://floodzuki.ngrok.io` (don't forget to pass the rest of the environment variables as well).


### Distribution

#### Web
To build the web version of the app run `$ npx expo build` (make sure that all the environment variables are apssed to the build). This will create a production build of the app in the `dist/` directory. You can read more about it in the [Expo Router docs](https://expo.github.io/router/docs/guides/hosting).

#### Mobile
To build the Android version of the app run `$ eas build --profile production --platform all` (all environment variables will be provided by EAS). This will trigger builds for both Android and iOS platforms. You can read more about it in the [EAS docs](https://docs.expo.dev/build/introduction/).


#### Internal Distribution
If you're an engineer working for the SVPA org and want to run the [internal distribution](https://docs.expo.dev/build/internal-distribution/) builds on your phone - register your device with expo by running
`$ eas device:create` 

after that you'll need to rebuild the app with `$ eas build --profile preview --platform all` and install it on your phone again.

#### EAS Updates
Android and iOS apps support OTA updates. If the new update is awailable - it'll be silently downloaded in background and user will be prompted to restart the app. User can choose to dismiss the prompt meaning that the new update will be applied on the next app start. You can read more about it in the [Expo docs](https://docs.expo.dev/workflow/publishing/).

The updates are created locally and don't have access to Expo Secrets therefore it is expected that to provide all the necessary environment variables when running an update. To publish a new update to the production app you'll need to run `$ eas update --channel production` command. Refer to `eas.json` to check other channels that are available for publishing.

The full command will look more like this (`APP_ENV="dev"` is used to bundle local `google-services.json` file):
```bash
$ APP_ENV="dev" GOOGLE_AUTH_CLIENT_SECRET="" GOOGLE_RECAPTCH_SITE_KEY="" GOOGLE_MAPS_API_KEY="" GOOGLE_AUTH_EXPO_ID="" GOOGLE_AUTH_WEB_ID="" GOOGLE_AUTH_IOS_ID="" GOOGLE_AUTH_ANDROID_ID="" eas update --channel production
```