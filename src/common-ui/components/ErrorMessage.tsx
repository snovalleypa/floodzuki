import React from "react"

import { Cell } from "./Common"
import { Spacing } from "@common-ui/constants/spacing"
import { RegularText } from "./Text"
import { Colors } from "@common-ui/constants/colors"

const ErrorMessage = ({ errorText }: { errorText: string }) => {
  return (
    <Cell align="center" vertical={Spacing.medium}>
      <RegularText color={Colors.red}>{errorText}</RegularText>
    </Cell>
  )
}

export default ErrorMessage
