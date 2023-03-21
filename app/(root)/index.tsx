import React, { useEffect } from "react"
import { ErrorBoundaryProps } from "expo-router"
import { observer } from "mobx-react-lite"

import { Content, Screen } from "@common-ui/components/Screen"
import { LargeTitle } from "@common-ui/components/Text"
import { useStores } from "@models/helpers/useStores"
import { ErrorDetails } from "@components/ErrorDetails"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const HomeScreen = observer(
  function HomeScreen() {
    const { regionStore, locationInfoStore, metagageStore, gagesStore, forecastsStore } = useStores()

    useEffect(() => {
      regionStore.fetchData()
      metagageStore.fetchData()
      locationInfoStore.fetchData()
      gagesStore.fetchData()
      forecastsStore.fetchData()
    }, [])

    const reg = regionStore.toJSON()
    const loc = locationInfoStore.toJSON()
    const met = metagageStore.toJSON()
    const gag = gagesStore.toJSON()
    const forc = forecastsStore.toJSON()

    console.log({
      reg,
      loc,
      met,
      gag,
      forc,
    })

    return (
      <Screen>
        <LargeTitle>
          Active
        </LargeTitle>
        <Content>
        </Content>
      </Screen>
    )
  }
)

export default HomeScreen
