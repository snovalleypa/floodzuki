/**
 * A Full-screen loading indicator
 */

import React from "react"
import { ActivityIndicator } from "react-native"

import { Cell } from "@common-ui/components/Common"
import { Screen } from "@common-ui/components/Screen"


export default function LoadingScreen() {
  return (
    <Screen>
      <Cell flex align="center" justify="center">
        <ActivityIndicator />
      </Cell>
    </Screen>
  )
}