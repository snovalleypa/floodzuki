import React from "react"
import { Cell } from "./Common"
import { RegularText } from "./Text"

const EmptyComponent = () => (
  <Cell flex align="center" justify="center">
    <RegularText>Loading ...</RegularText>
  </Cell>
)

export default EmptyComponent
