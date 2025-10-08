import { createContext, useContext } from "react";
import { Asset, useAssets } from "expo-asset";
import { MAP_IMAGE_ICONS } from "@components/TrendIcon";

// All assets used by the app
const ASSETS = {
  favicon: require("@assets/favicon-180.png"),
  favicon_gray: require("@assets/favicon-180-gray.png"),
  logo: require("@assets/app-icon/ios-universal.png"),
  svpaLogo: require("@assets/images/SVPA_Logo.png"),
  tasteOfTheValley: require("@assets/images/taste_of_the_valley.png"),
  tasteOfTheValleyMobile: require("@assets/images/taste_of_the_valley_mobile.png"),
  google_button: require("@assets/images/btn_google.png"),
  google_play_badge: require("@assets/images/google_play_badge.png"),
  app_store_badge: require("@assets/images/app_store_badge.png"),
}

const ASSET_KEYS = [...Object.keys(ASSETS), ...Object.keys(MAP_IMAGE_ICONS)]
const ASSET_VALUES = [...Object.values(ASSETS), ...Object.values(MAP_IMAGE_ICONS)]

type AppAsset = keyof typeof ASSETS

type AssetsContextType = {
  assetsLoaded: boolean,
  assetsLoadingError: Error | undefined,
  getAsset: (assetName: AppAsset) => Asset | undefined,
}

const AssetsContext = createContext<AssetsContextType>({
  assetsLoaded: false,
  assetsLoadingError: undefined,
  getAsset: () => undefined,
})

export const useAppAssets = () => useContext(AssetsContext)

export const AssetsProvider = ({ children }: { children: React.ReactNode }) => {
  const [assetsLoaded, assetsLoadingError] = useAssets(ASSET_VALUES)

  const getAsset = (assetName: string) => {
    const index = ASSET_KEYS.indexOf(assetName)
    return index >= 0 ? Asset.fromModule(ASSET_VALUES[index]) : undefined
  }

  const value = {
    assetsLoaded: assetsLoaded !== undefined,
    assetsLoadingError,
    getAsset,
  }

  return (
    <AssetsContext.Provider value={value}>
      {children}
    </AssetsContext.Provider>
  )
}
  

