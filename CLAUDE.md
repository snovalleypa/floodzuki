# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Floodzuki is the mobile/web client for the **Floodzilla Gauge Monitoring System**, operated by the Snoqualmie Valley Preservation Alliance (SVPA). It monitors river gauges on the Snoqualmie River and provides flood predictions and alerts. The app runs on iOS, Android, and Web via Expo/React Native.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (requires dev-client build on device)
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Export web build
npx expo export

# Serve web build locally
npx serve dist --single

# EAS mobile build (preview profile for both platforms)
eas build --profile preview --platform all

# Publish OTA update
eas update --channel production

# Type check — this is the only automated verification available
npx tsc --noEmit
```

There is no test runner configured. The only automated check is `npx tsc --noEmit`. Verify changes by type-checking and manual testing in the browser or on device.

### Environment variables for local dev

Create a `.env` file or pass inline:
```bash
BUILD_ENV="local" SENTRY_AUTH_TOKEN="" GOOGLE_AUTH_CLIENT_SECRET="" GOOGLE_RECAPTCH_SITE_KEY="" GOOGLE_AUTH_EXPO_ID="" GOOGLE_AUTH_WEB_ID="" GOOGLE_AUTH_IOS_ID="" GOOGLE_AUTH_ANDROID_ID="" GOOGLE_MAPS_IOS_API_KEY="" GOOGLE_MAPS_ANDROID_API_KEY="" GOOGLE_MAPS_WEB_API_KEY="" npx expo start
```

Google Auth only works in the browser via secure tunnel:
```bash
EXPO_TUNNEL_SUBDOMAIN="floodzuki" npx expo start --tunnel --web
```

## Architecture

### Tech stack
- **Expo SDK 55** with **React Native 0.83** and new architecture enabled (`newArchEnabled: true`)
- **Expo Router** (file-based routing under `app/`)
- **MobX State Tree** for global state management
- **apisauce** for HTTP requests
- **NativeWind** (Tailwind CSS for React Native) + custom design system in `src/common-ui/`
- **MapLibre** for maps (platform-split: `@maplibre/maplibre-react-native` on mobile, `@vis.gl/react-maplibre` on web)
- **Highcharts** (web) and **Victory Native** (mobile) for charts — the chart components are split by platform
- **i18n-js** for localization with `dayjs` for date/time

### Directory structure

```
app/                    # Expo Router screens (file-based routing)
  _layout.tsx           # Root layout — providers, fonts, splash screen, ROUTES enum
  (root)/               # Main tab group
    _layout.tsx         # Tab bar (gage, forecast, user tabs)
    gage/               # Gauge list and detail screens
    forecast/           # Forecast screens
    user/               # Auth, profile, alerts, settings screens

src/
  models/               # MobX State Tree stores
    RootStore.ts        # Root store composing all sub-stores
    Gage.ts             # Gauge data store
    GageReading.ts      # Reading/chart data store
    Forecasts.ts        # Forecast data store
    Region.ts           # Region metadata store
    LocationInfo.ts     # Location metadata store
    AuthSession.ts      # Auth token/session store
    helpers/            # useStores hook, store persistence
  services/
    api.ts              # Singleton Api class (apisauce) — all backend calls
    apiProblem.ts       # API error normalization
    expoUpdates.ts      # OTA update logic
    pushNotifications.ts
  components/           # App-specific components (charts, maps, cards)
  common-ui/            # Design system (platform-agnostic)
    components/         # Button, Text, Card, Icon, Screen, Conditional, Common (Row/Cell/Spacer)
    constants/          # Colors, Spacing, Typography
    contexts/           # AssetsContext, DatePickerContext, GoogleAuthContext, LocaleContext
    utils/              # responsive helpers, color utilities
  config/
    config.base.ts      # All API endpoints, base URLs, timing constants
    config.dev.ts       # Dev overrides
    config.prod.ts      # Prod overrides
    config.ts           # Merges base + dev/prod based on __DEV__
  i18n/                 # Translation strings
  utils/                # sentry, misc helpers
```

### Path aliases (tsconfig.json)

| Alias | Path |
|---|---|
| `@models/*` | `src/models/*` |
| `@services/*` | `src/services/*` |
| `@components/*` | `src/components/*` |
| `@common-ui/*` | `src/common-ui/*` |
| `@config/*` | `src/config/*` |
| `@i18n/*` | `src/i18n/*` |
| `@utils/*` | `src/utils/*` |

### State management pattern

The single `RootStore` (MST) is initialized once and provided via a `useStores()` hook (from `@models/helpers/useStores`). Each sub-store has a `fetchData()` action. `RootStore.fetchMainData()` orchestrates the initial data load sequence: region → location info → gages → forecasts.

The `authSessionStore` stores the JWT and manages login/logout; the API singleton (`@services/api`) handles auth headers by calling `api.setHeader()` / `api.removeHeader()`.

### API layer

`src/services/api.ts` exports a singleton `api` instance. The `Api` class has two base URLs — `Config.BASE_URL` (floodzilla.com) and `Config.READING_BASE_URL` (Azure reading service) — and switches between them per call. All responses go through `getGeneralApiProblem()` for normalized error handling.

### Platform-split components

Several components have native/web variants:
- `GageMap.tsx` (router) → `MapLibreMobileGageMap.tsx` / `MapLibreWebGageMap.tsx`
- `ForecastChart.tsx` / `ForecastChartNative.tsx`
- `GageDetailsChart.tsx` / `GageDetailsChartNative.tsx`

Check `src/common-ui/utils/responsive.ts` for the `isWeb` flag used to branch rendering.

### Routes

All routes are defined as the `ROUTES` enum in `app/_layout.tsx`. The three main tabs are **Gages** (`/gage`), **Forecast** (`/forecast`), and **User** (`/user`). Use the `ROUTES` enum rather than hardcoded strings when navigating.

### Localization

All user-visible strings go through the `useLocale()` hook (`t("key")`). Translation files live in `src/i18n/`. `LocaleContext.tsx` wraps the app at the root level.

### Maps

Maps use MapLibre with tile URLs from `Config.DEFAULT_MAP_TILE_BASE_URL`. The `MAP_TILE_URL_BASE` env var overrides the tile source at build time (exposed via `app.config.ts` extra). Maps are not supported in standalone dev builds — only Expo Go and browser.

### OTA Updates

The app uses `expo-updates` with channel `production`. OTA updates are published with `eas update --channel production`. All environment variables must be passed at update time since EAS secrets are not available locally.

### Timezone and time display

**All displayed times must use the gauge location's timezone, not the client's system timezone.** Readings and forecasts represent physical events at a specific location on Earth (the Snoqualmie Valley), so times should always reflect local conditions at that location regardless of where the user is viewing the app.

- Get the timezone via `rootStore.getTimezone()` (from `@models/helpers/useStores`), which returns the region timezone from the API (e.g. `"America/Los_Angeles"`) with a Pacific fallback.
- Use `dayjs(timestamp).tz(tz)` to convert a UTC or offset-aware string to the location timezone. Do **not** use `dayjs.tz(timestamp)` (the static form) — it does not convert UTC strings correctly; it displays the raw UTC value instead of converting it.
- The utility functions in `src/utils/useTimeFormat.ts` (`formatDateTime`, `formatReadingTime`) already follow this pattern and should be used for all time display.
