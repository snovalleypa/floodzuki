import { useState } from "react"
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native"

import { Spacing } from "@common-ui/constants/spacing"
import { isAndroid } from "@common-ui/utils/responsive"

// On Android WebView might crash if user scrolls to the bottom of the screen
// and triggers the scroll bounce effect. This is a workaround to prevent that.
// As soon as the chart goes out of view, we hide it.
export const useHideCharts = (chartHeight: number) => {
  const [hideChart, setHideChart] = useState(false)

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isAndroid) {
      return
    }

    const { y: scrollHeight } = event.nativeEvent.contentOffset

    const nextHideChart = scrollHeight > chartHeight + Spacing.extraLarge
    
    if (hideChart !== nextHideChart) {
      setHideChart(nextHideChart)
    }
  }

  return [hideChart, handleScroll] as const
}
