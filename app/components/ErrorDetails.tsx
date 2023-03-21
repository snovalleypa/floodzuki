import React from "react"
import { ErrorBoundaryProps } from "expo-router"

import { Screen, Content } from "@common-ui/components/Screen"
import { HugeTitle, LargeTitle, MediumText } from "@common-ui/components/Text"
import { SolidButton } from "@common-ui/components/Button"
import { Cell } from "@common-ui/components/Common"
import { Spacing } from "@common-ui/constants/spacing"

export function ErrorDetails(props: ErrorBoundaryProps) {
  return (
    <Screen>
      <HugeTitle text="Ooops..." left={Spacing.medium} />
      <Content>
        <Cell flex align="center">
          <LargeTitle bottom={Spacing.medium} text="Something went wrong!" />
          <MediumText align="center">
            We're working on the problem.{"\n"}In the meantime - feel free to try again.
          </MediumText>
        </Cell>

        <Cell align="center">
          <SolidButton onPress={props.retry} title="Try Again" />
        </Cell>
      </Content>
    </Screen>
  )
}
