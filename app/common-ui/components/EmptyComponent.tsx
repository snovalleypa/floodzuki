import React from "react"
import { Cell } from "./Common"
import { RegularText } from "./Text"
import { t } from "@i18n/translate"

const EmptyComponent = () => (
  <Cell flex align="center" justify="center">
    <RegularText>{t("common.loading")}</RegularText>
  </Cell>
)

export default EmptyComponent
