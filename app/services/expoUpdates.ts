import React, { useEffect } from "react"
import * as Updates from "expo-updates"
import { useTimeout } from "@utils/useTimeout"
import { Timing } from "@common-ui/constants/timing"
import { Alert } from "react-native"
import { isWeb } from "@common-ui/utils/responsive"

export const useExpoUpdates = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false)
  const [isUpdateLoaded, setIsUpdateLoaded] = React.useState(false)
  const [updateError, setError] = React.useState<Error | null>(null)

  const checkForUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync()

      if (update.isAvailable) {
        setIsUpdateAvailable(true)
        
        await Updates.fetchUpdateAsync()
        setIsUpdateLoaded(true)
      }
    } catch (error) {
      console.log("Error checking for updates", error)
      setError(error)
    }
  }

  const reloadApp = async () => {
    try {
      await Updates.reloadAsync()
    } catch (error) {
      setError(error)
    }
  }

  // Check for updates on mount
  // Delay to allow for other things to load
  useTimeout(() => {
    if (isWeb) {
      return
    }

    checkForUpdate()
  }, Timing.verySlow)

  return {
    isUpdateAvailable,
    isUpdateLoaded,
    updateError,
    reloadApp,
  }
}

export const useCheckForUpdates = () => {
  const { isUpdateAvailable, isUpdateLoaded, updateError, reloadApp } = useExpoUpdates()

  useEffect(() => {    
    if (isUpdateLoaded) {
      Alert.alert(
        "A new App Update is Available",
        "Do you want to reload the app to get the latest version?",
        [
          {
            text: "Cancel",
            onPress: () => {},
            style: "cancel",
          },
          {
            text: "Reload",
            onPress: () => {
              reloadApp()
            },
          },
        ],
      )
    }
  }, [isUpdateLoaded])

  return {
    isUpdateAvailable,
    isUpdateLoaded,
    updateError,
  }
}
